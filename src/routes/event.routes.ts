import { Router } from 'express';
import { authenticate, isOperatorOrAdmin, AuthRequest } from '../middleware/auth.middleware';
import { sendMatchEventNotification } from '../services/notification.service.firebase';
import prisma from '../utils/prisma';

const router = Router();

// Helper: compute live minute from match timestamps (server-authoritative)
function computeCurrentMinute(match: any): number {
  if (!match) return 1;
  const now = Date.now();

  if (match.status === 'live') {
    if (match.secondHalfStartedAt) {
      const elapsed = Math.floor((now - new Date(match.secondHalfStartedAt).getTime()) / 60000);
      return Math.max(46, 46 + elapsed);
    }
    if (match.liveStartedAt) {
      const elapsed = Math.floor((now - new Date(match.liveStartedAt).getTime()) / 60000);
      return Math.max(1, 1 + elapsed);
    }
  }

  if (match.status === 'extra_time') {
    const base = match.currentMinute || 91;
    const elapsed = Math.floor((now - new Date(match.updatedAt).getTime()) / 60000);
    return Math.max(base, base + elapsed);
  }

  // Halftime, penalties, etc — use stored value
  return match.currentMinute || 1;
}

// Event types enum (matching Prisma schema)
const EventType = {
  goal: 'goal',
  foul: 'foul',
  yellow_card: 'yellow_card',
  red_card: 'red_card',
  substitution: 'substitution',
  var_review: 'var_review',
  penalty: 'penalty',
  corner: 'corner',
  offside: 'offside',
  injury: 'injury',
  stop: 'stop',
  start_half: 'start_half',
  end_half: 'end_half',
  end_match: 'end_match',
} as const;

// Get all events for a match
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const events = await prisma.event.findMany({
      where: { matchId },
      include: {
        player: true,
        secondaryPlayer: true,
        team: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ minute: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
    });
  }
});

// Create event (Operator/Admin only)
router.post('/', authenticate, isOperatorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      matchId,
      minute: clientMinute,
      extraTime,
      type,
      teamId,
      playerId,
      secondaryPlayerId,
      posX,
      posY,
      description,
    } = req.body;

    // Verify operator is assigned to this match (unless admin)
    if (req.user!.role === 'operator') {
      const assignment = await prisma.matchOperator.findFirst({
        where: {
          matchId,
          operatorId: req.user!.id,
        },
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this match',
        });
      }
    }

    // Server-authoritative minute: compute from match timestamps
    const matchForMinute = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true, liveStartedAt: true, secondHalfStartedAt: true, currentMinute: true, updatedAt: true },
    });
    const serverMinute = matchForMinute ? computeCurrentMinute(matchForMinute) : (clientMinute || 1);

    // Keep match.currentMinute in sync
    await prisma.match.update({
      where: { id: matchId },
      data: { currentMinute: serverMinute },
    });

    // Create the event
    const event = await prisma.event.create({
      data: {
        matchId,
        minute: serverMinute,
        extraTime,
        type,
        teamId,
        playerId,
        secondaryPlayerId,
        posX,
        posY,
        description,
        createdById: req.user!.id,
      },
      include: {
        player: true,
        secondaryPlayer: true,
        team: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    // Update match score if goal
    if (type === EventType.goal && teamId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (match) {
        if (teamId === match.homeTeamId) {
          await prisma.match.update({
            where: { id: matchId },
            data: { homeScore: { increment: 1 } },
          });
        } else if (teamId === match.awayTeamId) {
          await prisma.match.update({
            where: { id: matchId },
            data: { awayScore: { increment: 1 } },
          });
        }

        // Fetch updated match with new scores
        const updatedMatch = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        });

        // Update event object with latest match data
        event.match = updatedMatch as any;
      }
    }

    // Emit real-time event via Socket.IO
    const io = req.app.get('io');
    console.log(`📡 Emitting match:event to room match:${matchId}`, {
      type: event.type,
      minute: event.minute,
    });
    io.to(`match:${matchId}`).emit('match:event', event);
    io.emit('global:event', event); // For live feed

    // Broadcast server-computed minute to keep all clients in sync
    io.to(`match:${matchId}`).emit('match:minute', {
      matchId,
      currentMinute: serverMinute,
    });

    // Send push notifications for important events
    const notificationTypes = [
      EventType.goal,
      EventType.red_card,
      EventType.penalty,
      EventType.start_half,
      EventType.end_half,
      EventType.end_match,
    ];

    if (notificationTypes.includes(type)) {
      console.log(`🔔 Sending push notification for event type: ${type}, matchId: ${matchId}`);
      try {
        await sendMatchEventNotification(matchId, type, {
          id: event.id,
          teamId: event.teamId,
          playerName: event.player?.name,
          minute: event.minute,
        });
        console.log(`✅ Push notification sent successfully for ${type}`);
      } catch (notifError) {
        console.error(`❌ Push notification failed for ${type}:`, notifError);
      }
    } else {
      console.log(`ℹ️ Event type ${type} is not in notification list, skipping push`);
    }

    res.status(201).json({
      success: true,
      message: 'Event created',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
});

// Delete event (Admin only)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete events
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete events',
      });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { match: true },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // If it was a goal, decrement the score
    if (event.type === EventType.goal && event.teamId) {
      if (event.teamId === event.match.homeTeamId) {
        await prisma.match.update({
          where: { id: event.matchId },
          data: { homeScore: { decrement: 1 } },
        });
      } else if (event.teamId === event.match.awayTeamId) {
        await prisma.match.update({
          where: { id: event.matchId },
          data: { awayScore: { decrement: 1 } },
        });
      }
    }

    await prisma.event.delete({
      where: { id },
    });

    // Emit deletion event
    const io = req.app.get('io');
    console.log(`📡 Emitting match:event:deleted to room match:${event.matchId}`, { eventId: id });
    io.to(`match:${event.matchId}`).emit('match:event:deleted', { 
      eventId: id,
      matchId: event.matchId,
    });

    res.json({
      success: true,
      message: 'Event deleted',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
});

// Helper functions for notifications
function getEventTitle(type: string): string {
  const titles: Record<string, string> = {
    goal: 'GOAL!',
    foul: 'Foul',
    yellow_card: 'Yellow Card',
    red_card: 'RED CARD!',
    substitution: 'Substitution',
    var_review: 'VAR Review',
    penalty: 'PENALTY!',
    corner: 'Corner Kick',
    offside: 'Offside',
    injury: 'Injury',
    stop: 'Match Stopped',
    start_half: 'Half Started',
    end_half: 'Half Time',
    end_match: 'Full Time',
  };
  return titles[type] || 'Match Event';
}

function getEventBody(event: any): string {
  const minute = event.extraTime
    ? `${event.minute}+${event.extraTime}'`
    : `${event.minute}'`;

  const matchTitle = `${event.match.homeTeam.shortName} vs ${event.match.awayTeam.shortName}`;

  if (event.player) {
    return `${minute} - ${event.player.name} (${matchTitle})`;
  }

  return `${minute} - ${matchTitle}`;
}

export default router;
