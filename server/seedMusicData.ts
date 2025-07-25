import { storage } from "./storage";
import type { InsertMusicContent, InsertBookRecommendation } from "@shared/schema";

export async function seedRussellNomerContent() {
  try {
    // Russell Nomer's featured tracks from research
    const featuredTracks: InsertMusicContent[] = [
      {
        platform: "unitedmasters",
        trackTitle: "Gold and Red",
        trackUrl: "https://unitedmasters.com/m/gold-and-red",
        coverImageUrl: "https://united-masters.imgix.net/mih85T5eWL7x?fit=crop&w=400&h=400&q=80&auto=compress,format",
        genre: "Alternative Rock",
        releaseDate: new Date("2025-01-01"),
        featured: 1,
        isActive: 1
      },
      {
        platform: "soundcloud",
        trackTitle: "Fatal Whispers",
        trackUrl: "https://soundcloud.com/russell-nomer/fatal-whispers",
        embedCode: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/russell-nomer/fatal-whispers&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
        genre: "Pop",
        featured: 1,
        isActive: 1
      },
      {
        platform: "soundcloud",
        trackTitle: "A Songwriter's Prayer",
        trackUrl: "https://soundcloud.com/russell-nomer/a-songwriters-prayer-1",
        embedCode: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/russell-nomer/a-songwriters-prayer-1&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
        genre: "Alternative Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "unitedmasters",
        trackTitle: "King of Yesterday's Night",
        trackUrl: "https://unitedmasters.com/m/king-of-yesterday-s-night",
        coverImageUrl: "https://united-masters.imgix.net/mWFYMukfGF3c?fit=crop&w=400&h=400&q=80&auto=compress,format",
        genre: "Alternative Rock",
        featured: 0,
        isActive: 1
      },
      {
        platform: "soundcloud",
        trackTitle: "Pulse of a Patriot",
        trackUrl: "https://soundcloud.com/russell-nomer/pulse-of-a-patriot",
        genre: "Rock",
        featured: 0,
        isActive: 1
      },
      {
        platform: "unitedmasters",
        trackTitle: "The Risk You Didn't Take",
        trackUrl: "https://unitedmasters.com/m/the-risk-you-didn-t-take",
        coverImageUrl: "https://united-masters.imgix.net/mXk4NsRtmjcV?fit=crop&w=400&h=400&q=80&auto=compress,format",
        genre: "Alternative Rock",
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