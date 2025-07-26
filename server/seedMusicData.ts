import { storage } from "./storage";
import type { InsertMusicContent, InsertBookRecommendation } from "@shared/schema";

export async function seedRussellNomerContent() {
  try {
    // Russell Nomer's actual songs - gambling and lottery themed
    const featuredTracks: InsertMusicContent[] = [
      {
        platform: "youtube",
        trackTitle: "Lucky Numbers",
        trackUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Russell Nomer's upbeat anthem about finding your lucky lottery numbers and beating the odds",
        genre: "Pop Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "spotify",
        trackTitle: "Casino Nights",
        trackUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
        description: "A smooth blues rock track capturing the electric atmosphere of casino floors and high-stakes gambling",
        genre: "Blues Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "youtube",
        trackTitle: "Powerball Dreams",
        trackUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Inspiring rock ballad about chasing Powerball jackpots and never giving up on your dreams",
        genre: "Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "spotify",
        trackTitle: "Roll the Dice",
        trackUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
        description: "High-energy rock anthem about taking calculated risks and seizing gambling opportunities",
        genre: "Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "youtube",
        trackTitle: "MegaMillions Magic",
        trackUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Electronic-pop fusion celebrating the magic and excitement of MegaMillions lottery draws",
        genre: "Electronic Pop",
        featured: 1,
        isActive: 1
      },
      {
        platform: "spotify",
        trackTitle: "Blackjack Heart",
        trackUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
        description: "Soulful blues about the emotional highs and lows of blackjack strategy and casino life",
        genre: "Blues",
        featured: 0,
        isActive: 1
      },
      {
        platform: "youtube",
        trackTitle: "Winning Streak",
        trackUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Driving rock song about riding hot gambling streaks and maximizing your winning potential",
        genre: "Rock",
        duration: "3:51",
        releaseYear: 2024,
        featured: 0,
        isActive: 1
      },
      {
        platform: "spotify",
        trackTitle: "Lottery Fever",
        trackUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
        description: "Funky rock groove capturing the infectious excitement and anticipation of lottery fever",
        genre: "Funk Rock",
        duration: "3:29",
        releaseYear: 2024,
        featured: 0,
        isActive: 1
      }
    ];

    // Russell's gambling strategy books
    const books: InsertBookRecommendation[] = [
      {
        title: "The Degenerate Gambler's Guide to Finding Winning Slot Machines",
        amazonUrl: "https://amzn.to/46yqulj",
        description: "Master the art of slot machine selection with proven strategies from Russell Nomer. Learn the insider secrets of finding the most profitable machines and maximizing your winning potential.",
        category: "gambling",
        displayOrder: 1,
        isActive: 1
      },
      {
        title: "Mastering the Craps Table: Strategies for Success",
        amazonUrl: "https://amzn.to/4lPKy7t",
        description: "Unlock the mysteries of craps with Russell Nomer's comprehensive guide to table strategies. From basic bets to advanced techniques, become a craps master with this essential handbook.",
        category: "strategy",
        displayOrder: 2,
        isActive: 1
      }
    ];

    // Check if content already exists to avoid duplicates
    const existingMusic = await storage.getMusicContent();
    const existingBooks = await storage.getBookRecommendations();

    if (existingMusic.length === 0) {
      console.log("SEED_DATA - Adding Russell Nomer Music content...");
      for (const track of featuredTracks) {
        try {
          await storage.createMusicContent(track);
          console.log(`✅ Added track: ${track.trackTitle}`);
        } catch (error) {
          console.error(`❌ Failed to add track ${track.trackTitle}:`, error);
        }
      }
    }

    if (existingBooks.length === 0) {
      console.log("SEED_DATA - Adding Russell Nomer book recommendations...");
      for (const book of books) {
        try {
          await storage.createBookRecommendation(book);
          console.log(`✅ Added book: ${book.title}`);
        } catch (error) {
          console.error(`❌ Failed to add book ${book.title}:`, error);
        }
      }
    }

    console.log("✅ Russell Nomer Music content and book recommendations ready!");

  } catch (error) {
    console.error("❌ Error seeding Russell Nomer content:", error);
  }
}