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

    // Russell Nomer's Complete 35-Book Collection - Ontology-Based Organization
    // PRIMARY FOCUS: Gambling strategy books (prominently featured)
    // SECONDARY: Other 32 books organized by subject matter for additional revenue
    const books: InsertBookRecommendation[] = [
      // === FEATURED GAMBLING STRATEGY BOOKS (Primary Revenue Focus) ===
      {
        title: "Russell Nomer's Complete 35-Book Amazon Collection",
        amazonUrl: "https://amzn.to/4m6r2mS", // Updated to complete collection link
        description: "Discover Russell's complete collection of all 35 books on Amazon, featuring acclaimed gambling strategy guides plus cybersecurity, AI, and blockchain expertise. Support Russell's recovery journey.",
        category: "collection",
        displayOrder: 1,
        isActive: 1
      },
      {
        title: "The Degenerate Gambler's Guide to Finding Winning Slot Machines",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Master slot machine selection with Russell's proven strategies. Learn insider secrets for finding profitable machines and maximizing winning potential. ⭐ 5.0/5 stars on Amazon.",
        category: "gambling",
        displayOrder: 2,
        isActive: 1
      },
      {
        title: "Mastering the Craps Table: Strategies for Success",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Unlock craps mysteries with Russell's comprehensive table strategies. From basic bets to advanced techniques, become a craps master. ⭐ 4.1/5 stars on Amazon.",
        category: "gambling",
        displayOrder: 3,
        isActive: 1
      },

      // === CYBERSECURITY & TECHNOLOGY (Professional Expertise) ===
      {
        title: "The CISO's Guide to Securing Artificial Intelligence",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Essential AI security guide from Russell's professional cybersecurity expertise. Protect your organization against AI-specific threats and vulnerabilities. ⭐ 5.0/5 stars.",
        category: "cybersecurity",
        displayOrder: 4,
        isActive: 1
      },
      {
        title: "Hardening Windows 11",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Comprehensive Windows 11 security hardening guide. Professional cybersecurity techniques for enterprise and personal protection. ⭐ 3.2/5 stars.",
        category: "cybersecurity",
        displayOrder: 5,
        isActive: 1
      },
      {
        title: "Cybersecurity Tabletop Exercises: MITRE ATT&CK Scenarios",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Practical cybersecurity training scenarios using industry-standard MITRE ATT&CK framework. Professional-grade security exercises for teams.",
        category: "cybersecurity",
        displayOrder: 6,
        isActive: 1
      },
      {
        title: "Hardening Salesforce: Securing Your CRM",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Secure your Salesforce implementation with Russell's expert CRM security strategies. Protect customer data and business operations effectively.",
        category: "cybersecurity",
        displayOrder: 7,
        isActive: 1
      },
      {
        title: "Mastering Onchain Security: Blockchain Defenders Guide",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Comprehensive blockchain security from Russell's cutting-edge expertise. Protect digital assets, smart contracts, and cryptocurrency investments.",
        category: "blockchain",
        displayOrder: 8,
        isActive: 1
      },

      // === COMPLIANCE & CERTIFICATION (Business/Professional) ===
      {
        title: "A Step-by-Step Guide to Obtaining FedRamp Certification",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Navigate federal compliance with Russell's detailed FedRamp certification guide. Essential for government contractors. ⭐ 4.5/5 stars.",
        category: "compliance",
        displayOrder: 9,
        isActive: 1
      },
      {
        title: "SOC2 Type 1 & Type 2 Certification Guide",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Master SOC2 compliance with Russell's comprehensive attestation and certification guide. Essential for business security and client trust.",
        category: "compliance",
        displayOrder: 10,
        isActive: 1
      },

      // === MENTAL HEALTH & WELLNESS (Personal Development) ===
      {
        title: "The Cybersecurity Professional's Guide to Mental Health",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Strengthen resilience and emotional well-being in high-stress cybersecurity careers. Russell's personal insights on maintaining mental health while working in technology.",
        category: "wellness",
        displayOrder: 11,
        isActive: 1
      },

      // === SOCIAL & POLITICAL COMMENTARY ===
      {
        title: "Beyond Woke: Reclaiming Critical Thinking and Rational Thought",
        amazonUrl: "https://amzn.to/4m6r2mS",
        description: "Russell's perspective on modern discourse and critical thinking. Thoughtful commentary on social and political issues. ⭐ 5.0/5 stars on Amazon.",
        category: "social",
        displayOrder: 12,
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