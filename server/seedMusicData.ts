import { storage } from "./storage";
import youtubeService from "./youtubeService";
import type { InsertMusicContent, InsertBookRecommendation } from "@shared/schema";

export async function seedRussellNomerContent() {
  try {
    // First, try to fetch Russell's actual songs from YouTube
    let actualSongs: any[] = [];
    try {
      console.log('🎵 Fetching Russell Nomer\'s actual songs from YouTube...');
      actualSongs = await youtubeService.getRussellNomerSongs();
    } catch (error) {
      console.warn('⚠️  Could not fetch from YouTube, using fallback data:', error);
    }

    // Convert YouTube songs to our format, or use fallback
    const featuredTracks: InsertMusicContent[] = actualSongs.length > 0 
      ? actualSongs.slice(0, 8).map((song, index) => ({
          platform: "youtube",
          trackTitle: song.title,
          trackUrl: song.url,
          coverImageUrl: song.thumbnailUrl,
          // description: `Russell Nomer's authentic track: ${song.title}${song.description ? ' - ' + song.description.slice(0, 100) : ''}`, // Not in schema
          genre: index % 3 === 0 ? "Alternative Rock" : index % 3 === 1 ? "Pop" : "Rock",
          releaseDate: song.publishedAt ? new Date(song.publishedAt) : new Date(),
          featured: index < 4 ? 1 : 0,
          isActive: 1
        }))
      : [
      {
        platform: "unitedmasters",
        trackTitle: "Gold and Red",
        trackUrl: "https://unitedmasters.com/m/gold-and-red",
        coverImageUrl: "https://united-masters.imgix.net/mih85T5eWL7x?fit=crop&w=400&h=400&q=80&auto=compress,format",
        description: "Russell Nomer's powerful alternative rock track - themes of perseverance that resonate with lottery players and risk-takers",
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
        description: "Atmospheric pop track by Russell Nomer exploring life's calculated risks and whispered possibilities",
        genre: "Pop",
        featured: 1,
        isActive: 1
      },
      {
        platform: "soundcloud",
        trackTitle: "A Songwriter's Prayer",
        trackUrl: "https://soundcloud.com/russell-nomer/a-songwriters-prayer-1",
        embedCode: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/russell-nomer/a-songwriters-prayer-1&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
        description: "Deeply personal alternative rock piece reflecting Russell's journey through adversity and creative expression",
        genre: "Alternative Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "unitedmasters",
        trackTitle: "King of Yesterday's Night",
        trackUrl: "https://unitedmasters.com/m/king-of-yesterday-s-night",
        coverImageUrl: "https://united-masters.imgix.net/mWFYMukfGF3c?fit=crop&w=400&h=400&q=80&auto=compress,format",
        description: "Reflective alternative rock exploring themes of resilience and hope - perfect backdrop for strategic thinking",
        genre: "Alternative Rock",
        featured: 1,
        isActive: 1
      },
      {
        platform: "soundcloud",
        trackTitle: "Pulse of a Patriot",
        trackUrl: "https://soundcloud.com/russell-nomer/pulse-of-a-patriot",
        description: "Rock anthem by Russell Nomer celebrating American spirit and determination against all odds",
        genre: "Rock",
        featured: 0,
        isActive: 1
      },
      {
        platform: "unitedmasters",
        trackTitle: "The Risk You Didn't Take",
        trackUrl: "https://unitedmasters.com/m/the-risk-you-didn-t-take",
        coverImageUrl: "https://united-masters.imgix.net/mXk4NsRtmjcV?fit=crop&w=400&h=400&q=80&auto=compress,format",
        description: "Powerful alternative rock meditation on missed opportunities and the courage to take calculated risks",
        genre: "Alternative Rock",
        featured: 0,
        isActive: 1
      }
    ];

    // Russell's gambling strategy books
    const books: InsertBookRecommendation[] = [
      {
        title: "Russell Nomer's Complete Gambling Strategy Collection",
        amazonUrl: "https://amzn.to/4op76h9",
        description: "Discover Russell's complete collection of gambling strategy books on Amazon. From slot machine selection to advanced table game strategies, find all of Russell's expert gambling guides in one place.",
        category: "collection",
        displayOrder: 1,
        isActive: 1
      },
      {
        title: "The Degenerate Gambler's Guide to Finding Winning Slot Machines",
        amazonUrl: "https://amzn.to/4op76h9",
        description: "Master the art of slot machine selection with proven strategies from Russell Nomer. Learn the insider secrets of finding the most profitable machines and maximizing your winning potential.",
        category: "gambling",
        displayOrder: 2,
        isActive: 1
      },
      {
        title: "Mastering the Craps Table: Strategies for Success",
        amazonUrl: "https://amzn.to/4op76h9",
        description: "Unlock the mysteries of craps with Russell Nomer's comprehensive guide to table strategies. From basic bets to advanced techniques, become a craps master with this essential handbook.",
        category: "strategy",
        displayOrder: 3,
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