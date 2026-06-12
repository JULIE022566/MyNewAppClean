import React, { createContext, useContext, useState, ReactNode } from 'react';

type MessageContextType = {
  hasNewMessage: boolean;
  setHasNewMessage: (value: boolean) => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [hasNewMessage, setHasNewMessage] = useState(false);

  return (
    <MessageContext.Provider value={{ hasNewMessage, setHasNewMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessage must be used within a MessageProvider');
  return context;
};