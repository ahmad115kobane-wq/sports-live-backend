import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
          role: string;
        };
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      } catch (err) {
        // Allow unauthenticated connections for public match viewing
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join match room
    socket.on('match:join', (matchId: string) => {
      socket.join(`match:${matchId}`);
      console.log(`👁 Socket ${socket.id} joined match:${matchId}`);
    });

    // Leave match room
    socket.on('match:leave', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      console.log(`👋 Socket ${socket.id} left match:${matchId}`);
    });

    // Join live feed (all matches)
    socket.on('livefeed:join', () => {
      socket.join('livefeed');
      console.log(`📡 Socket ${socket.id} joined live feed`);
    });

    // Leave live feed
    socket.on('livefeed:leave', () => {
      socket.leave('livefeed');
    });

    // Operator: broadcast typing/preparing event
    socket.on('operator:typing', (data: { matchId: string }) => {
      if (socket.userRole === 'operator' || socket.userRole === 'admin') {
        socket.to(`match:${data.matchId}`).emit('operator:typing', {
          matchId: data.matchId,
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });

  // Utility function to broadcast to a match room
  io.broadcastToMatch = (matchId: string, event: string, data: any) => {
    io.to(`match:${matchId}`).emit(event, data);
  };

  // Utility function to broadcast globally
  io.broadcastGlobal = (event: string, data: any) => {
    io.emit(event, data);
  };

  console.log('✅ Socket.IO handlers initialized');
}

// Extend Server type
declare module 'socket.io' {
  interface Server {
    broadcastToMatch: (matchId: string, event: string, data: any) => void;
    broadcastGlobal: (event: string, data: any) => void;
  }
}
