import { Link, useRoute } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  excerpt: string;
  content: Section[];
}

interface Section {
  heading: string;
  body: string;
  cta?: { text: string; href: string };
}

const blogPosts: BlogPost[] = [
  {
    slug: "powerball-number-frequency-analysis",
    title: "Powerball Number Frequency Analysis: What 2,000+ Draws Reveal",
    description: "Explore what over 2,000 Powerball draws reveal about number frequency patterns, hot and cold numbers, and how data-driven analysis works.",
    category: "Analysis",
    readTime: "7 min read",
    date: "February 15, 2026",
    excerpt: "Ever wondered which Powerball numbers appear most often? We analyzed over 2,020 real Powerball draws from NY State lottery data to uncover frequency patterns. Here's what the data shows.",
    content: [
      {
        heading: "What is Frequency Analysis?",
        body: "Frequency analysis is a statistical method that examines how often each number has been drawn over a given period. In the context of lottery games like Powerball, frequency analysis involves tallying every main ball and Powerball number across hundreds or thousands of past drawings to identify which numbers appear more or less often than average.\n\nThe concept is straightforward: if Powerball draws 5 white balls from a pool of 69 (plus 1 Powerball from 26), each white ball number has a theoretical probability of appearing in roughly 7.25% of draws. Over 2,000+ draws, some numbers will naturally appear above this expected rate and others below it. Frequency analysis quantifies these deviations.\n\nIt is important to understand that each Powerball drawing is an independent event. Past results do not influence future outcomes — the balls have no memory. However, frequency analysis remains a popular tool for players who want to make informed selections rather than relying purely on random picks."
      },
      {
        heading: "Hot Numbers vs Cold Numbers",
        body: "In lottery analysis, \"hot numbers\" are those that have appeared significantly more frequently than the statistical average over a defined period. \"Cold numbers\" are the opposite — they have appeared less often than expected.\n\nFor example, across more than 2,020 Powerball draws, certain white ball numbers have historically shown up 15–20% more often than the mathematical expectation, while others have lagged behind by a similar margin. Hot numbers attract players who believe in momentum — the idea that frequently drawn numbers may continue their streak. Cold numbers appeal to those who expect a statistical correction, reasoning that underrepresented numbers are \"due\" to appear.\n\nNeither approach has a mathematical edge. Each draw is independent, and the odds reset every time. However, many players find that using frequency data adds structure to their number selection process and makes the experience more engaging.\n\nLotteryPro categorizes numbers into hot, warm, cool, and cold tiers based on their historical frequency percentile, giving users a clear visual breakdown of how each number has performed."
      },
      {
        heading: "How LotteryPro Uses Real Data",
        body: "LotteryPro's analysis engine is built on verified historical drawing data sourced from the New York State lottery. Our database includes over 2,020 actual Powerball draws and more than 1,590 Mega Millions draws, updated regularly to reflect the latest results.\n\nWhen you use LotteryPro's number generator, the system processes this historical data in real time. It calculates frequency distributions, identifies statistical outliers, and presents the results through an intuitive interface. You can view frequency charts, filter by date range, and explore patterns across different time windows — the last 100 draws, the last 500 draws, or the full dataset.\n\nThe platform also applies additional analytical methods beyond simple frequency counting, including gap analysis (how many draws since a number last appeared), pair frequency analysis (which number combinations appear together most often), and positional frequency (how often a number appears in each drawn position).\n\nAll analysis is performed transparently. LotteryPro does not claim to predict future outcomes. The tools are designed to help players explore historical data and make selections based on real statistics rather than superstition or pure randomness.",
        cta: { text: "Try the frequency analysis tool", href: "/" }
      },
      {
        heading: "Try It Yourself",
        body: "Ready to explore Powerball number frequency data firsthand? LotteryPro's free tier gives you access to basic frequency analysis, hot and cold number breakdowns, and statistically-informed number generation. Simply select Powerball from the game menu and choose a frequency-based generation method to see the data in action.\n\nWhether you prefer to follow hot numbers, target cold numbers due for a comeback, or use a balanced approach that considers the full frequency spectrum, LotteryPro provides the data you need to make your own informed choices.",
        cta: { text: "Generate your numbers free", href: "/" }
      }
    ]
  },
  {
    slug: "mega-millions-vs-powerball-odds",
    title: "Mega Millions vs Powerball: Understanding the Odds",
    description: "A detailed comparison of Mega Millions and Powerball odds, prize structures, drawing schedules, and what the numbers mean for players.",
    category: "Education",
    readTime: "8 min read",
    date: "February 10, 2026",
    excerpt: "Mega Millions and Powerball are America's two biggest lottery games, but how do their odds actually compare? We break down the mathematics, prize tiers, and key differences every player should understand.",
    content: [
      {
        heading: "The Basics: How Each Game Works",
        body: "Powerball and Mega Millions share a similar structure but differ in their number pools, which directly affects the odds of winning.\n\nPowerball requires players to choose 5 white balls from a pool of 69, plus 1 red Powerball from a separate pool of 26. Drawings occur every Monday, Wednesday, and Saturday at 10:59 PM ET.\n\nMega Millions asks players to choose 5 white balls from a pool of 70, plus 1 gold Mega Ball from a separate pool of 25. Drawings take place every Tuesday and Friday at 11:00 PM ET.\n\nThe slight differences in pool sizes create meaningful differences in the overall odds of winning the jackpot and various prize tiers."
      },
      {
        heading: "Jackpot Odds Compared",
        body: "The odds of winning the Powerball jackpot are approximately 1 in 292.2 million. For Mega Millions, the jackpot odds are approximately 1 in 302.6 million. This means Mega Millions is roughly 3.5% harder to win at the top level.\n\nTo put these numbers in perspective, you are statistically more likely to be struck by lightning twice in your lifetime than to win either jackpot. The odds are astronomical, and no strategy, system, or analysis can change the fundamental probability of any single ticket winning.\n\nHowever, the odds of winning any prize are much more favorable. In Powerball, the overall odds of winning any prize are about 1 in 24.9. In Mega Millions, the overall odds of winning any prize are about 1 in 24. These smaller prizes range from $2 (matching just the Powerball or Mega Ball) up to $1 million or more for matching 5 white balls without the bonus ball."
      },
      {
        heading: "Prize Structure Breakdown",
        body: "Both games offer 9 prize tiers, but the amounts and structures differ:\n\nPowerball's second-largest fixed prize is $1 million for matching all 5 white balls without the Powerball. With the Power Play multiplier (an additional $1 per ticket), this can increase to $2 million.\n\nMega Millions' second-largest fixed prize is also $1 million for matching 5 white balls without the Mega Ball. The Megaplier option (also $1 extra) can multiply non-jackpot prizes by 2x, 3x, 4x, or 5x.\n\nThe minimum Powerball prize for matching just the Powerball is $4. The minimum Mega Millions prize for matching just the Mega Ball is $2. This difference means the expected return on a Powerball ticket is slightly different from a Mega Millions ticket at the lower prize tiers.\n\nStarting jackpots and rollover mechanics also differ. Both games have produced jackpots exceeding $1 billion, with the largest Mega Millions jackpot reaching $1.537 billion in October 2018 and the largest Powerball jackpot reaching $2.04 billion in November 2022."
      },
      {
        heading: "Drawing Schedules and Availability",
        body: "Powerball draws three times per week (Monday, Wednesday, Saturday), while Mega Millions draws twice per week (Tuesday, Friday). This means Powerball offers 50% more opportunities to play each week, which also means jackpots can grow faster due to more frequent rollovers.\n\nBoth games are available in 45 states, plus Washington D.C. and the U.S. Virgin Islands. Mega Millions is also available in American Samoa, while Powerball is available in Puerto Rico. Powerball tickets are $2 per play, while Mega Millions tickets are $5 per play.\n\nLotteryPro supports both Powerball and Mega Millions with full historical data analysis. You can switch between games to compare frequency patterns, generate numbers for either game, and track results all in one place.",
        cta: { text: "Analyze both games on LotteryPro", href: "/" }
      },
      {
        heading: "Which Game Should You Play?",
        body: "From a pure odds perspective, Powerball offers slightly better jackpot odds (1 in 292 million vs 1 in 303 million). However, the difference is marginal in practical terms — both represent extreme long shots.\n\nSome players choose based on current jackpot size, playing whichever game has the larger prize pool at the moment. Others prefer Powerball's three weekly drawings over Mega Millions' two. And some players simply play both.\n\nThe most important thing to remember is that lottery games are a form of entertainment, not an investment strategy. Set a budget you are comfortable with, play responsibly, and enjoy the experience. No amount of analysis changes the fundamental odds of any individual ticket.\n\nLotteryPro provides data and analysis tools for both games to help you explore patterns and make informed picks — but we always encourage responsible play above all else."
      }
    ]
  },
  {
    slug: "lottery-pool-strategies-guide",
    title: "How Lottery Pools Work: A Complete Guide to Group Play",
    description: "Learn how lottery pools and syndicates work, their benefits, how to organize one properly, and how LotteryPro's community pools feature simplifies group play.",
    category: "Strategy",
    readTime: "7 min read",
    date: "February 5, 2026",
    excerpt: "Lottery pools let groups of people combine their purchasing power to buy more tickets and improve their collective odds. Here's everything you need to know about organizing and joining a lottery pool.",
    content: [
      {
        heading: "What is a Lottery Pool?",
        body: "A lottery pool (also called a lottery syndicate) is a group of people who agree to combine their money to purchase multiple lottery tickets, then share any winnings proportionally among all members.\n\nThe concept is simple: if one person buys 1 ticket, they have 1 chance to win. If 20 people each contribute $2 and buy 20 tickets, the group has 20 chances to win. While each individual's share of a jackpot would be smaller, the probability of the group winning something increases proportionally with the number of tickets purchased.\n\nLottery pools are extremely popular in workplaces, among friend groups, and within families. Some of the largest lottery jackpots in history have been won by pools. In 2013, a group of 16 co-workers split a $448 million Powerball jackpot — each member took home roughly $28 million before taxes.\n\nPools don't change the odds of any single ticket winning. They simply allow participants to collectively hold more tickets than they could afford individually, which increases the group's overall probability of winning any prize."
      },
      {
        heading: "Benefits of Group Play",
        body: "The primary benefit of a lottery pool is increased coverage. If your pool buys 50 tickets for a single drawing, you have 50 independent chances to win instead of one. For a Powerball drawing, that moves your jackpot odds from roughly 1 in 292 million to 1 in 5.8 million — still a long shot, but significantly better.\n\nPools also reduce individual cost. Instead of spending $10 on five tickets yourself, you might contribute $5 to a pool that purchases 50 tickets. You get 10 times the coverage for half the personal expense.\n\nThere's also a social component. Playing in a pool adds a shared excitement to lottery drawings and creates a community experience. Many long-running office pools report that the camaraderie and anticipation are as valuable as the actual chance of winning.\n\nFinally, pools can employ systematic strategies like number spreading — ensuring the group's tickets cover a wide range of numbers rather than duplicating similar combinations. This maximizes the diversity of number sets the group holds."
      },
      {
        heading: "How to Organize a Pool Properly",
        body: "Organizing a lottery pool correctly is essential to avoid disputes if the group wins. Here are the key steps:\n\nFirst, designate a pool manager. This person is responsible for collecting contributions, purchasing tickets, and distributing copies of the tickets to all members. The manager should be someone trusted by the group.\n\nSecond, create a written agreement. Even for casual pools among friends, a simple document should specify: who the members are, how much each person contributes, how winnings will be split, what happens if a member misses a contribution, and which drawings the pool will participate in.\n\nThird, keep meticulous records. The manager should photograph or scan every ticket purchased and distribute copies to all members before the drawing. This prevents any ambiguity about which tickets belong to the pool.\n\nFourth, decide on the logistics. Will the pool play every drawing or only when the jackpot exceeds a certain threshold? Will contributions be weekly or per-drawing? Will the pool use quick picks or specific number selections?\n\nFifth, agree on what happens with small winnings. Many pools reinvest small prizes (under $50 or $100) into future ticket purchases rather than distributing them."
      },
      {
        heading: "LotteryPro's Community Pools Feature",
        body: "LotteryPro's Community Pools feature streamlines the entire lottery pool experience. Instead of managing spreadsheets and group chats, pool organizers can create a digital pool on LotteryPro that handles member tracking, contribution records, and number generation.\n\nThe platform allows pool managers to set up pools with clear parameters — contribution amounts, member limits, target games, and drawing schedules. Members can join pools, view the group's ticket selections, and track results all in one place.\n\nLotteryPro's number generation tools are especially valuable for pools because they allow groups to generate diverse number sets using statistical analysis rather than relying entirely on quick picks. Pool managers can generate numbers using frequency-based methods, balanced distribution, or other analytical approaches to ensure the group's tickets cover a wide range of possibilities.\n\nAll pool activity is tracked transparently, so every member can see exactly what numbers the group is playing and how contributions are being used.",
        cta: { text: "Explore Community Pools", href: "/pools" }
      },
      {
        heading: "Important Considerations",
        body: "While lottery pools are a fun and social way to play, there are important factors to keep in mind. Always use a written agreement — verbal agreements can lead to legal disputes if the group wins a significant prize. Several high-profile lawsuits have occurred when pool members disagreed about whether a winning ticket was purchased with pool funds or individually.\n\nBe clear about membership. If someone doesn't contribute for a particular drawing, they should not be entitled to a share of winnings from that drawing. Document this clearly.\n\nUnderstand tax implications. In the United States, lottery winnings are subject to federal and state taxes. When a pool wins, the tax burden is typically distributed among members, but the logistics can be complex for large prizes. Consult a tax professional if your pool wins a significant amount.\n\nFinally, remember that pools are meant to be enjoyable. Set contribution amounts that are comfortable for all members, play responsibly, and keep the focus on the shared experience rather than the expectation of winning."
      }
    ]
  },
  {
    slug: "smart-number-generation-methods",
    title: "5 Smart Number Generation Methods Beyond Random Picks",
    description: "Discover five data-driven number generation methods including frequency analysis, balanced distribution, and wheel systems that go beyond simple random picks.",
    category: "Methods",
    readTime: "8 min read",
    date: "January 28, 2026",
    excerpt: "Most lottery players either use quick picks or personal numbers like birthdays. But there are several systematic approaches to number selection that use real data and mathematical principles. Here are five methods worth knowing.",
    content: [
      {
        heading: "1. Frequency-Based Selection",
        body: "Frequency-based selection uses historical drawing data to identify which numbers have appeared most (or least) often over a given period. Players can choose to favor hot numbers (those appearing more frequently than average) or cold numbers (those appearing less often).\n\nThe logic behind hot number selection is momentum — if a number has been drawn frequently in recent drawings, some players believe it may continue to appear. Cold number selection operates on the opposite premise — that underrepresented numbers may be statistically due for an appearance.\n\nLotteryPro's frequency analysis engine processes over 2,020 Powerball draws and 1,590+ Mega Millions draws to calculate precise frequency percentages for every number. Users can filter by time period to see frequency shifts over the last 50, 100, 500, or all available draws. This granularity allows players to align their number selection with the specific frequency window they find most meaningful."
      },
      {
        heading: "2. Balanced Distribution Method",
        body: "The balanced distribution method aims to create number sets that are statistically representative of the overall number pool. Rather than clustering selections in one part of the range (like picking all numbers below 31, which is common when players use birthdays), this method distributes picks evenly across the full number range.\n\nFor Powerball, where white balls range from 1 to 69, a balanced set might include one number from each segment: 1–14, 15–28, 29–42, 43–56, and 57–69. This ensures coverage across the entire range and avoids the pattern of selecting only low numbers.\n\nBalanced distribution also considers the ratio of odd to even numbers and high to low numbers. Historically, winning combinations tend to include a mix of both rather than all odd, all even, all high, or all low numbers. While this doesn't change the probability of any specific combination, it does mean balanced sets more closely resemble typical winning patterns."
      },
      {
        heading: "3. Lottery Wheel Systems",
        body: "Lottery wheeling is a systematic method for organizing number selections to guarantee that if certain numbers are drawn, at least one of your ticket combinations will include them. Wheels work by creating multiple combinations from a larger set of selected numbers.\n\nFor example, if you have 10 favorite numbers but can only play 5 per ticket, a wheel system generates all (or a strategically selected subset of) possible 5-number combinations from your 10 numbers. This ensures broader coverage of your preferred numbers across multiple tickets.\n\nThere are three main types of wheel systems: full wheels (which cover every possible combination from your selected numbers), abbreviated wheels (which guarantee a minimum match level, like 3 out of 5, if the winning numbers are within your set), and key number wheels (which include one or two \"key\" numbers in every combination).\n\nWheeling can be expensive because it requires purchasing multiple tickets. However, it is popular among pool players who can split the cost across the group. LotteryPro's generation tools can help create wheeled combinations based on your preferred number set."
      },
      {
        heading: "4. Gap and Due Number Analysis",
        body: "Gap analysis examines how many drawings have passed since each number last appeared. Numbers with large gaps (many draws since their last appearance) are sometimes called \"overdue\" numbers.\n\nThe theory behind due number analysis is rooted in the concept of regression to the mean — over a large enough sample, every number should appear with roughly equal frequency. If a number hasn't appeared in 50 draws when it would statistically be expected to appear every 14 draws, some players consider it overdue.\n\nIt is critical to understand that this reasoning, while intuitively appealing, is a form of the gambler's fallacy. Each drawing is independent, and the balls have no memory of previous results. A number that hasn't appeared in 50 draws is exactly as likely to appear in the next draw as a number that appeared last week.\n\nThat said, gap analysis provides interesting data points and can be used as one factor among many in a systematic selection approach. LotteryPro displays gap data alongside frequency data so users can see the full statistical picture for every number."
      },
      {
        heading: "5. Statistical Combination Analysis",
        body: "Statistical combination analysis looks at patterns across groups of numbers rather than individual number frequencies. This includes examining which pairs or triplets of numbers appear together most often, whether certain number sums are more common among winning combinations, and how the overall distribution of a combination compares to historical winners.\n\nFor instance, the sum of the 5 white Powerball numbers in winning combinations typically falls within a certain range. Combinations with extremely low sums (like 1+2+3+4+5 = 15) or extremely high sums (like 65+66+67+68+69 = 335) are possible but statistically rare among winning draws. Most winning combinations fall somewhere in the middle range.\n\nPair analysis reveals that some number pairs appear together more frequently than probability alone would predict. While these correlations may be coincidental artifacts of a limited sample size, they provide data points for players who want to build their selections around historically co-occurring numbers.\n\nLotteryPro's advanced analysis tools include pair frequency tracking and combination scoring to help users evaluate their number sets against historical patterns.",
        cta: { text: "Try smart number generation", href: "/" }
      },
      {
        heading: "A Word on Expectations",
        body: "No number generation method — whether frequency-based, balanced, wheeled, or any other system — can improve the fundamental odds of winning a lottery jackpot. The odds of any specific 5-number combination being drawn in Powerball are always 1 in 292.2 million, regardless of how those numbers were selected.\n\nWhat these methods can do is add structure, data, and intentionality to the selection process. Many players find that using analytical approaches makes the experience more engaging and enjoyable than simple random picks.\n\nLotteryPro provides all of these generation methods as free tools. Our goal is to give players access to real historical data and legitimate statistical analysis — not to promise outcomes that are mathematically impossible. Play responsibly, set a budget, and treat lottery participation as entertainment.",
        cta: { text: "Generate your numbers free", href: "/" }
      }
    ]
  }
];

const categoryColors: Record<string, string> = {
  Analysis: "bg-blue-100 text-blue-800",
  Education: "bg-green-100 text-green-800",
  Strategy: "bg-purple-100 text-purple-800",
  Methods: "bg-orange-100 text-orange-800",
};

export function BlogIndex() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Lottery Analysis Blog - Tips, Stats & Strategies"
        description="Educational articles about lottery number analysis, frequency statistics, pool strategies, and smart number generation methods. Data-driven insights from LotteryPro."
        path="/blog"
        type="website"
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LotteryPro Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Educational articles about lottery statistics, number analysis methods, and smart play strategies. All content is for informational and entertainment purposes only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={categoryColors[post.category] || "bg-gray-100 text-gray-800"} variant="secondary">
                      {post.category}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500 gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                    {post.title}
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-xs text-gray-400 gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                      Read more <ArrowRight size={14} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Ready to try smart picks?
          </h2>
          <p className="text-blue-200 mb-6 max-w-lg mx-auto">
            Generate your lottery numbers free using real historical data and statistical analysis methods.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
              Generate Your Numbers Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog
          </Button>
        </Link>

        <header className="mb-10">
          <Badge className={categoryColors[post.category] || "bg-gray-100 text-gray-800"} variant="secondary">
            {post.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>By LotteryPro Team</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readTime}
            </span>
          </div>
        </header>

        <div className="space-y-8">
          {post.content.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                {section.body.split("\n\n").map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
              {section.cta && (
                <div className="mt-4">
                  <Link href={section.cta.href}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      {section.cta.text}
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> This article is for informational and entertainment purposes only. Lottery games are games of chance, and no analysis method, strategy, or system can guarantee winning outcomes. Past drawing results do not influence future results. Always play responsibly and within your budget. If you or someone you know has a gambling problem, call 1-800-GAMBLER for help.
          </p>
        </div>

        <div className="mt-10 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-3">
            Try LotteryPro's Analysis Tools
          </h2>
          <p className="text-blue-200 mb-5">
            Explore real historical data from 2,020+ Powerball and 1,590+ Mega Millions draws.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}