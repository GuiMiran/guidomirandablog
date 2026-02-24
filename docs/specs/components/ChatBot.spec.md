# Component Specification: ChatBot

## Overview
Interactive chat widget that allows users to communicate with an AI assistant about blog content. Provides real-time responses and maintains conversation history.

## Props Interface
```typescript
interface ChatBotProps {
  /** Optional custom theme configuration */
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  
  /** Initial messages to display */
  initialMessages?: ChatMessage[];
  
  /** Callback when chat is opened/closed */
  onToggle?: (isOpen: boolean) => void;
  
  /** Maximum number of messages to display */
  maxMessages?: number;
  
  /** API endpoint for chat (defaults to /api/ai/chat) */
  apiEndpoint?: string;
}
```

## States
- **Closed**: Widget is minimized showing only the chat icon
- **Open**: Chat window is expanded and visible
- **Idle**: No active conversation, waiting for user input
- **Loading**: Processing user message and waiting for AI response
- **Error**: Error occurred during message processing
- **Typing**: User is typing a message

## Behavior

### Opening/Closing
- Clicking the chat icon opens the chat window
- Clicking the close button collapses the chat window
- Chat state persists during session (messages retained)

### Message Flow
1. User types message in input field
2. Submit on Enter key or Send button click
3. User message appears immediately in chat
4. Loading indicator shows while waiting for response
5. AI response appears in chat when received
6. Input field is cleared and refocused

### Message Display
- Messages are displayed in chronological order (oldest first)
- User messages aligned right with distinct styling
- AI messages aligned left with distinct styling
- Auto-scroll to newest message
- Timestamp displayed for each message

### Error Handling
- Network errors show user-friendly error message
- API errors show generic error message
- Errors logged to console for debugging
- User can retry by sending new message

### Accessibility
- Keyboard navigation supported (Tab, Enter, Escape)
- ARIA labels for all interactive elements
- Screen reader announcements for new messages
- Focus management on open/close

## API Contract
```typescript
// Request
POST /api/ai/chat
{
  messages: ChatMessage[]
}

// Response
{
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}

// Error Response
{
  error: string;
}
```

## Required Tests

### Unit Tests
- [ ] Renders closed state by default
- [ ] Opens when chat icon is clicked
- [ ] Closes when close button is clicked
- [ ] Displays initial messages if provided
- [ ] Adds user message to chat on submit
- [ ] Shows loading state while fetching response
- [ ] Displays AI response when received
- [ ] Shows error message on API failure
- [ ] Clears input field after sending
- [ ] Prevents sending empty messages
- [ ] Respects maxMessages prop
- [ ] Calls onToggle callback when opened/closed

### Integration Tests
- [ ] Successfully sends message to API
- [ ] Handles API error responses
- [ ] Maintains conversation history
- [ ] Auto-scrolls to new messages

### Accessibility Tests
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works correctly
- [ ] Focus is trapped within modal when open
- [ ] Escape key closes the chat
- [ ] New messages are announced to screen readers

### Visual Regression Tests
- [ ] Closed state appearance
- [ ] Open state appearance
- [ ] Loading state appearance
- [ ] Error state appearance
- [ ] Message layout and styling

## Dependencies
- React (useState, useEffect, useRef)
- Fetch API for HTTP requests
- ChatMessage type from @/types

## Performance Considerations
- Lazy load component to reduce initial bundle size
- Implement message virtualization if >100 messages
- Debounce input typing indicator
- Cache recent responses (optional)

## Future Enhancements
- [ ] Voice input support
- [ ] File attachment support
- [ ] Message reactions
- [ ] Conversation persistence across sessions
- [ ] Multi-language support
- [ ] Suggested quick replies
- [ ] Typing indicator when AI is responding
