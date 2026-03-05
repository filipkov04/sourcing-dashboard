export const quotes = [
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "Opportunities multiply as they are seized.", author: "Sun Tzu" },
  { text: "Fortune favors the bold.", author: "Virgil" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
];

export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
