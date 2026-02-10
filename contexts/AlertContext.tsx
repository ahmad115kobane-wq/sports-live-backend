import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import AppDialog, { DialogType, DialogButton } from '@/components/ui/AppDialog';

interface AlertOptions {
  type?: DialogType;
  buttons?: DialogButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, options?: AlertOptions) => void;
  alert: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  alert: () => {},
});

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    type: DialogType;
    title: string;
    message?: string;
    buttons: DialogButton[];
  }>({
    type: 'info',
    title: '',
    message: '',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  const hideDialog = useCallback(() => {
    setVisible(false);
  }, []);

  const wrapButtons = useCallback((buttons: DialogButton[]): DialogButton[] => {
    return buttons.map(btn => ({
      ...btn,
      onPress: () => {
        hideDialog();
        btn.onPress?.();
      },
    }));
  }, [hideDialog]);

  // Simple API: showAlert(title, message, { type, buttons })
  const showAlert = useCallback((title: string, message?: string, options?: AlertOptions) => {
    const type = options?.type || 'info';
    const buttons = options?.buttons || [{ text: 'OK', style: 'default' as const }];

    setDialogProps({
      type,
      title,
      message,
      buttons: wrapButtons(buttons),
    });
    setVisible(true);
  }, [wrapButtons]);

  // Drop-in replacement for Alert.alert(title, message, buttons)
  // Auto-detects type from button styles & title keywords
  const alert = useCallback((
    title: string,
    message?: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => {
    const btnArray = buttons || [{ text: 'OK', style: 'default' as const }];

    // Auto-detect type
    let type: DialogType = 'info';
    const titleLower = (title || '').toLowerCase();
    const hasDestructive = btnArray.some(b => b.style === 'destructive');

    if (hasDestructive) {
      type = 'warning';
    } else if (
      titleLower.includes('error') || titleLower.includes('خطأ') || titleLower.includes('فشل') ||
      titleLower.includes('هەڵە') || titleLower.includes('خطا')
    ) {
      type = 'error';
    } else if (
      titleLower.includes('success') || titleLower.includes('نجاح') || titleLower.includes('تم') ||
      titleLower.includes('سەرکەوت')
    ) {
      type = 'success';
    } else if (
      titleLower.includes('warning') || titleLower.includes('تحذير') || titleLower.includes('ئاگاداری')
    ) {
      type = 'warning';
    } else if (btnArray.some(b => b.style === 'cancel')) {
      type = 'confirm';
    }

    setDialogProps({
      type,
      title,
      message,
      buttons: wrapButtons(btnArray.map(b => ({
        text: b.text,
        onPress: b.onPress,
        style: b.style,
      }))),
    });
    setVisible(true);
  }, [wrapButtons]);

  return (
    <AlertContext.Provider value={useMemo(() => ({ showAlert, alert }), [showAlert, alert])}>
      {children}
      <AppDialog
        visible={visible}
        type={dialogProps.type}
        title={dialogProps.title}
        message={dialogProps.message}
        buttons={dialogProps.buttons}
        onDismiss={hideDialog}
      />
    </AlertContext.Provider>
  );
}
