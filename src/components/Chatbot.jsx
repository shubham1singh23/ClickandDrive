import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

// Configuration options
const CONFIG = {
  // You could store this in a separate config file instead
  GEMINI_API_KEY: 'AIzaSyAtV8MZ12UtcZ4XqOOaXVifgiPawr1ODqM', // Replace with your actual API key
};

// Simple markdown parser for common Gemini formatting
const parseMarkdown = (text) => {
  if (!text) return '';

  // Replace bold formatting (**text** or __text__)
  let parsed = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  // Replace italic formatting (*text* or _text_)
  parsed = parsed.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // Replace bullet points
  parsed = parsed.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive list items in ul tags
  parsed = parsed.replace(/<li>(.+?)(<li>|$)/gs, '<ul><li>$1</li></ul>$2');

  // Fix any duplicate or nested ul tags
  parsed = parsed.replace(/<\/ul>\s*<ul>/g, '');

  // Handle line breaks
  parsed = parsed.replace(/\n/g, '<br/>');

  return parsed;
};

const ChatBot = ({ userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm your car rental assistant. How can I help you today?", sender: "bot" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user"
    };

    setMessages([...messages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call to Gemini API
      const response = await fetchGeminiResponse(inputMessage);

      // Parse markdown in the response
      const parsedResponse = parseMarkdown(response);

      const newBotMessage = {
        id: messages.length + 2,
        text: parsedResponse,
        sender: "bot",
        isHtml: true // Flag to indicate HTML content
      };

      setMessages(prevMessages => [...prevMessages, newBotMessage]);

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: inputMessage }] },
        { role: 'model', parts: [{ text: response }] } // Keep original response in history
      ]);
    } catch (error) {
      console.error("Error fetching response from Gemini:", error);

      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: "bot"
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Function to fetch response from Gemini API
  const fetchGeminiResponse = async (userMessage) => {
    // Create a system prompt that contextualizes the chatbot for car rental assistance
    const systemPrompt = `You are a helpful customer service assistant for a car rental application. 
      The app allows users to rent cars from others, add their own cars to be rented, and request drivers. 
      Provide helpful, concise, and accurate information about car rentals, the process, pricing, and policies. 
      The user's email is ${userEmail}. 
      
      When responding to user queries:
      - Be polite and professional
      - Provide specific information about how to use the car rental platform
      - If you don't know specific details about their account or bookings, explain that they can check those details in the appropriate section of the app
      - Keep responses concise but complete
      - You may use markdown formatting for emphasis (bold with ** or italic with *) when appropriate
      
      Current features of the app include:
      - Browsing available cars
      - Adding your own car to the platform
      - Making rental requests
      - Requesting drivers
      - Viewing rental and driver requests`;

    try {
      // Check if API key is available
      if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
        return "API key not configured. Please add your Gemini API key to the application.";
      }

      // Updated API URL with the correct model name (gemini-2.0-flash) and API version (v1beta)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': CONFIG.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...conversationHistory,
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0].content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error("Gemini API error:", data.error);
        return "I'm having trouble connecting to my knowledge base. Please try again later or contact customer support for immediate assistance.";
      } else {
        return "I'm not sure how to respond to that. Can you try rephrasing your question about our car rental service?";
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  return (
    <div className="chatbot-container">
      <button
        className={`chat-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h2>Car Rental Assistant</h2>
          <button
            className="close-button"
            onClick={toggleChat}
            aria-label="Close chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender}`}
            >
              {message.isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: message.text }} />
              ) : (
                message.text
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message bot loading">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask about car rentals..."
            ref={inputRef}
            aria-label="Message input"
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={inputMessage.trim() === '' || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;