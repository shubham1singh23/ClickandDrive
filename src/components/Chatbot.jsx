import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { useNavigate } from 'react-router-dom'; // Import for navigation

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

  // Replace italic formatting (*text* or _text*)
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

const ChatBot = ({ userEmail, onFilterUpdate }) => {
  const navigate = useNavigate(); // Initialize the navigate function
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm your car rental assistant. How can I help you today?", sender: "bot" }
  ]);
  const [inputMessage, setInputMessage] = useState('suggest a car for ');
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
      // Set cursor position at the end of the text
      inputRef.current.selectionStart = inputRef.current.value.length;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === 'suggest a car for') return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user"
    };

    setMessages([...messages, newUserMessage]);
    setInputMessage('suggest a car for ');
    setIsLoading(true);

    try {
      const response = await fetchGeminiResponse(inputMessage);

      // Check if response contains filter suggestions
      if (response.includes('{') && response.includes('}')) {
        try {
          // Extract JSON from response
          const jsonStr = response.substring(
            response.indexOf('{'),
            response.lastIndexOf('}') + 1
          );
          const filterData = JSON.parse(jsonStr);

          // Apply filters through callback
          if (filterData.filters) {
            onFilterUpdate(filterData.filters);
            // Close the chat window after applying filters
            setIsOpen(false);

            // Navigate to home page
            navigate('/');

            // Add smooth scroll to car listings
            setTimeout(() => {
              const carListingsElement = document.querySelector('.cars-grid');
              if (carListingsElement) {
                carListingsElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }, 500); // Wait for navigation to complete
          }

          // Add explanation to chat
          const newBotMessage = {
            id: messages.length + 2,
            text: filterData.explanation,
            sender: "bot"
          };
          setMessages(prevMessages => [...prevMessages, newBotMessage]);
        } catch (error) {
          console.error("Error parsing filter JSON:", error);
        }
      } else {
        // Regular chat response
        const newBotMessage = {
          id: messages.length + 2,
          text: response,
          sender: "bot"
        };
        setMessages(prevMessages => [...prevMessages, newBotMessage]);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
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
    // Updated system prompt in fetchGeminiResponse function
    const systemPrompt = `You are an intelligent, highly professional, and friendly **customer support assistant** for ClicknDrive, a cutting-edge **car rental platform**. Your role is to assist users by providing **clear, accurate, and engaging** responses about the platform, its features, and the rental process.  

    ### **General Guidelines for Responses:**  
    - Be **polite, professional, and user-friendly**.  
    - Provide **step-by-step guidance** when explaining platform features.  
    - **Personalize responses** when possible using the user's email: ${userEmail}.  
    - Use **markdown formatting** for readability (e.g., **bold** for key points, *italic* for emphasis).  
    - Keep responses **concise yet informative** to ensure users get all necessary details without feeling overwhelmed.  
    - Anticipate potential follow-up questions and **offer proactive solutions**.  
    
    ---
    
    ## **🚗 ClicknDrive Features & How to Use Them**  
    
    ### **1️⃣ Browsing & Renting a Car**  
    - Users can explore **available cars** using filters such as **type, price, location, and features**.  
    - To rent a car:  
      1. Click on a car listing to view **detailed specifications, images, and pricing**.  
      2. Select **rental duration** and any **optional add-ons (e.g., insurance, extra driver)**.  
      3. Confirm the rental and proceed with **secure payment options**.  
      4. Track rental status in the **"My Rentals"** section.  
    
    **💡 Tip:** Ensure the car matches your **budget, needs, and trip duration** before booking!  
    
    ---
    
    ### **2️⃣ Listing Your Own Car for Rent**  
    - Users can list their **personal or commercial vehicles** for rent by following these steps:  
      1. Navigate to **"Add Car"** in your dashboard.  
      2. Provide essential details:  
         - **Car brand & model**  
         - **Year, mileage, fuel type**  
         - **Pricing per day/hour**  
         - **Availability schedule**  
         - **High-quality images**  
      3. Click **Submit** to make the listing live.  
    
    **💡 Tip:** Well-maintained cars with **clear images and competitive pricing** attract more renters!  
    
    ---
    
    ### **3️⃣ Managing Rental Requests & Transactions**  
    - View, accept, or decline rental requests in the **"Manage Requests"** section.  
    - Track payments, earnings, and upcoming rentals in the **"Earnings Dashboard"**.  
    - Update car availability or modify pricing as needed.  
    
    ---
    
    ### **4️⃣ Hiring a Driver for Your Rental**  
    - If users require a driver, they can request one during car booking:  
      - Choose **"Hire a Driver"** option.  
      - Select from available **licensed professionals** based on ratings & reviews.  
      - The driver's details will be shared upon confirmation.  
    
    **💡 Tip:** Check driver credentials and reviews for a smooth experience!  
    
    ---
    
    ## **🔍 Frequently Asked Questions (FAQs)**  
    
    ### **🔹 What payment methods are supported?**  
    - ClicknDrive accepts **credit/debit cards, PayPal, and digital wallets**.  
    
    ### **🔹 What happens if a rental car gets damaged?**  
    - Rentals include **damage policies**. Review the **insurance coverage** before booking.  
    
    ### **🔹 Can I cancel a booking?**  
    - Yes, but cancellation policies vary. Check the **cancellation terms** before booking.  
    
    ---
    
    ## **🤖 Advanced Capabilities of the Chatbot**  
    - **Smart Recommendations**: Suggests cars based on user preferences.  
    - **Instant Rental Status Updates**: Provides real-time tracking of rental requests.  
    - **Multi-language Support** *(if applicable)*.  
    - **24/7 Customer Assistance** for **rental issues, disputes, and guidance**.  
    
    Let me know how I can assist you today! 😊 🚘
    
    Available Filters:
    1. Car Types: Sedan, SUV, Hatchback, Luxury
   
    2. Car Brands: Toyota, Honda, Ford, BMW, Mercedes, Audi, Hyundai, Kia, Volkswagen, Nissan and other famous car brands you can find it  on internet
    3. Seating Capacity: 2, 4, 5, 7, 8 dont filter any seating capacity until asked
    4. Price Range: Min to Max in ₹ per hour
    5. Fuel Types: Petrol, Diesel, Electric, Hybrid
    6. Transmission: Manual, Automatic

        IMPORTANT: When suggesting cars, ONLY include filters that the user specifically asked for. DO NOT include any filter categories that weren't explicitly mentioned by the user. For example, if the user only asks for a Toyota, only include the carBrands filter with "Toyota", and DO NOT include any other filters.
        Important :If the user asks for cars for specific conditions like  offroading , racing , family trip,fuel efficient, long drives etc. then suggest the car types and brands accordingly.
    If the user asks for a car for a specific number of people, include the seating capacity filter with the required number and seats more than required can also be displayed. For example, if the user asks for a car for 5 people, include the seating capacity filter with 5.

    When suggesting cars, respond with a JSON structure like this:
    {
      "filters": {
        "carTypes": ["type1", "type2"],
        "carBrands": ["brand1", "brand2"],
        "seatingCapacities": [number],//suggest all seating capacities from 2 to required number
        "priceRange": { "min": number, "max": number },
        "fuelTypes": ["type1", "type2"],
        "transmission": ["type1", "type2"]
      },
      "explanation": "Brief explanation of why these filters were chosen"
    }

    Keep the regular conversation friendly but when user asks for car suggestions, provide the JSON response.`;

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

  // Add event listener for toggling chatbot
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('toggleChatbot', handleToggleEvent);

    return () => {
      window.removeEventListener('toggleChatbot', handleToggleEvent);
    };
  }, []);

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
            placeholder="suggest a car for..."
            ref={inputRef}
            aria-label="Message input"
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={inputMessage.trim() === 'suggest a car for' || isLoading}
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