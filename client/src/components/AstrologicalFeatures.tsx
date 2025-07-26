import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, 
  Moon, 
  Sun, 
  Sparkles, 
  Gem, 
  Zap,
  ExternalLink,
  ShoppingCart
} from "lucide-react";

interface AstrologicalFeaturesProps {
  compact?: boolean;
}

interface ZodiacSign {
  name: string;
  element: string;
  dates: string;
  luckyNumbers: number[];
  powerballLucky: number;
  megaMillionsLucky: number;
  dailyHoroscope: string;
  lotteryAdvice: string;
}

const zodiacSigns: Record<string, ZodiacSign> = {
  aries: {
    name: "Aries",
    element: "Fire",
    dates: "Mar 21 - Apr 19",
    luckyNumbers: [1, 8, 17, 28, 33],
    powerballLucky: 3,
    megaMillionsLucky: 9,
    dailyHoroscope: "Mars energy brings bold lottery choices today. Trust your instincts with quick picks.",
    lotteryAdvice: "Fire signs like aggressive number selection. Consider hot numbers and avoid conservative picks."
  },
  taurus: {
    name: "Taurus",
    element: "Earth",
    dates: "Apr 20 - May 20",
    luckyNumbers: [2, 6, 14, 24, 42],
    powerballLucky: 15,
    megaMillionsLucky: 7,
    dailyHoroscope: "Venus influences favor steady, consistent number patterns. Stick to your lucky combinations.",
    lotteryAdvice: "Earth signs benefit from systematic approaches. Use wheeling systems and consistent play."
  },
  gemini: {
    name: "Gemini",
    element: "Air",
    dates: "May 21 - Jun 20",
    luckyNumbers: [5, 13, 22, 35, 46],
    powerballLucky: 11,
    megaMillionsLucky: 23,
    dailyHoroscope: "Mercury's influence suggests mixing strategies. Try both hot and cold number combinations.",
    lotteryAdvice: "Air signs should diversify. Play multiple games and vary your number selection methods."
  },
  cancer: {
    name: "Cancer",
    element: "Water",
    dates: "Jun 21 - Jul 22",
    luckyNumbers: [4, 7, 16, 29, 38],
    powerballLucky: 2,
    megaMillionsLucky: 13,
    dailyHoroscope: "Moon phases affect your intuition. Trust gut feelings about number combinations today.",
    lotteryAdvice: "Water signs have strong intuition. Use birth dates and meaningful numbers from your past."
  },
  leo: {
    name: "Leo",
    element: "Fire",
    dates: "Jul 23 - Aug 22",
    luckyNumbers: [3, 10, 19, 31, 44],
    powerballLucky: 21,
    megaMillionsLucky: 5,
    dailyHoroscope: "Sun's power amplifies your natural luck. Consider bold, high-number selections.",
    lotteryAdvice: "Fire signs shine with confident choices. Don't be afraid of less popular number combinations."
  },
  virgo: {
    name: "Virgo",
    element: "Earth",
    dates: "Aug 23 - Sep 22",
    luckyNumbers: [6, 12, 23, 34, 47],
    powerballLucky: 18,
    megaMillionsLucky: 8,
    dailyHoroscope: "Mercury's analytical energy helps you spot patterns. Study recent draw frequencies.",
    lotteryAdvice: "Earth signs excel at analysis. Use statistical methods and frequency charts for selections."
  },
  libra: {
    name: "Libra",
    element: "Air",
    dates: "Sep 23 - Oct 22",
    luckyNumbers: [7, 15, 26, 37, 49],
    powerballLucky: 14,
    megaMillionsLucky: 19,
    dailyHoroscope: "Venus brings balance to your choices. Mix high and low numbers for harmony.",
    lotteryAdvice: "Air signs seek balance. Choose numbers that create visual and mathematical symmetry."
  },
  scorpio: {
    name: "Scorpio",
    element: "Water",
    dates: "Oct 23 - Nov 21",
    luckyNumbers: [9, 18, 27, 39, 45],
    powerballLucky: 8,
    megaMillionsLucky: 22,
    dailyHoroscope: "Pluto's transformative energy suggests major lottery shifts. Consider life-changing number sets.",
    lotteryAdvice: "Water signs have psychic abilities. Meditate on numbers and trust supernatural instincts."
  },
  sagittarius: {
    name: "Sagittarius",
    element: "Fire",
    dates: "Nov 22 - Dec 21",
    luckyNumbers: [11, 20, 32, 41, 50],
    powerballLucky: 25,
    megaMillionsLucky: 12,
    dailyHoroscope: "Jupiter expands your luck potential. Think big with jackpot-focused number selection.",
    lotteryAdvice: "Fire signs are natural gamblers. Take calculated risks with unconventional combinations."
  },
  capricorn: {
    name: "Capricorn",
    element: "Earth",
    dates: "Dec 22 - Jan 19",
    luckyNumbers: [8, 17, 25, 36, 48],
    powerballLucky: 10,
    megaMillionsLucky: 16,
    dailyHoroscope: "Saturn's discipline rewards methodical play. Stick to proven strategies and budgets.",
    lotteryAdvice: "Earth signs build wealth steadily. Create long-term lottery investment plans."
  },
  aquarius: {
    name: "Aquarius",
    element: "Air",
    dates: "Jan 20 - Feb 18",
    luckyNumbers: [4, 21, 30, 40, 51],
    powerballLucky: 7,
    megaMillionsLucky: 24,
    dailyHoroscope: "Uranus brings unexpected opportunities. Try random quick picks and unusual number patterns.",
    lotteryAdvice: "Air signs are innovative. Experiment with new lottery apps and unconventional strategies."
  },
  pisces: {
    name: "Pisces",
    element: "Water",
    dates: "Feb 19 - Mar 20",
    luckyNumbers: [12, 19, 28, 43, 52],
    powerballLucky: 6,
    megaMillionsLucky: 20,
    dailyHoroscope: "Neptune's mystical energy enhances dreams about winning numbers. Pay attention to sleep visions.",
    lotteryAdvice: "Water signs are deeply intuitive. Use meditation and dream journals to receive number guidance."
  }
};

export default function AstrologicalFeatures({ compact = false }: AstrologicalFeaturesProps) {
  const [selectedSign, setSelectedSign] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [showHoroscope, setShowHoroscope] = useState<boolean>(false);

  const getZodiacFromDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces';
    
    return '';
  };

  const handleDateChange = (dateStr: string) => {
    setBirthDate(dateStr);
    const zodiac = getZodiacFromDate(dateStr);
    if (zodiac) {
      setSelectedSign(zodiac);
      setShowHoroscope(true);
    }
  };

  const currentSign = selectedSign ? zodiacSigns[selectedSign] : null;

  return (
    <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-6 w-6" />
          ✨ Astrological Lottery Guidance
        </CardTitle>
        <p className="text-purple-100">
          Discover your zodiac's lucky numbers and cosmic lottery insights
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Birth Date Input */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Your Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="zodiacSelect">Or Select Your Sign</Label>
              <Select value={selectedSign} onValueChange={(value) => {
                setSelectedSign(value);
                setShowHoroscope(true);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose your zodiac sign" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(zodiacSigns).map(([key, sign]) => (
                    <SelectItem key={key} value={key}>
                      {sign.name} ({sign.dates})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Zodiac Display */}
        {currentSign && showHoroscope && (
          <div className="space-y-6">
            {/* Sign Header */}
            <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
              <h3 className="text-2xl font-bold text-purple-800 mb-2">
                {currentSign.name} ♈
              </h3>
              <div className="flex justify-center gap-4 text-sm">
                <Badge variant="outline" className="bg-white">
                  {currentSign.element} Element
                </Badge>
                <Badge variant="outline" className="bg-white">
                  {currentSign.dates}
                </Badge>
              </div>
            </div>

            {/* Lucky Numbers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Lucky Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {currentSign.luckyNumbers.map((num, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Powerball Bonus:</span>
                      <Badge className="bg-red-500">{currentSign.powerballLucky}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>MegaMillions Bonus:</span>
                      <Badge className="bg-blue-500">{currentSign.megaMillionsLucky}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Moon className="h-5 w-5 text-blue-500" />
                    Today's Horoscope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">{currentSign.dailyHoroscope}</p>
                  <Alert>
                    <Gem className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Lottery Strategy:</strong> {currentSign.lotteryAdvice}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Gambling-Focused Astrology Resources */}
            <Alert className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300">
              <Sun className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <strong>🎯 Professional Gambling Astrology Guides</strong>
                    <p className="text-sm mt-1">
                      Planetary timing guides, lucky number calculations, and casino astrology specifically for serious gamblers and lottery players.
                    </p>
                    <div className="text-xs text-orange-700 mt-2">
                      ⭐ Planetary casino timing • 🎲 Zodiac gambling strategies • 📅 Lucky day calculators • 🎰 Moon phase betting guides
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="ml-4 bg-orange-500 hover:bg-orange-600"
                    onClick={() => window.open('https://amzn.to/46tfENm', '_blank')}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Shop Gambling Astrology
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* Generate Numbers Button */}
            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => {
                  // In a real implementation, this would integrate with the main lottery number generator
                  alert(`Generated cosmic numbers for ${currentSign.name}: ${currentSign.luckyNumbers.join(', ')} + Bonus: ${currentSign.powerballLucky}`);
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate My Cosmic Lottery Numbers
              </Button>
            </div>
          </div>
        )}

        {!showHoroscope && (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Enter your birth date or select your zodiac sign to unlock personalized lottery guidance!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}