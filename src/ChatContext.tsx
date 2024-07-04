import React, { createContext, useReducer, ReactNode, useContext } from "react";

interface Message {
  sender: string;
  text: string;
  isSent: boolean;
}

interface State {
  messages: Message[];
}

interface Action {
  type: string;
  payload: Message;
}

const initialState: State = {
  messages: [],
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
};

const ChatContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
