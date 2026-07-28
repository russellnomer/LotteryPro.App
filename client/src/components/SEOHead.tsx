import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
  jsonLd?: object;
}

const defaultJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LotteryPro",
  "description": "Educational lottery number analysis for Powerball and Mega Millions. Study historical frequency patterns, hot/cold numbers, and scratch-off prize data.",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web, iOS",
  "url": "https://lotterypro.app",
  "author": {
    "@type": "Person",
    "name": "Russell Nomer",
    "url": "https://russellnomermusic.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "7.99",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "7.99",
      "priceCurrency": "USD",
      "unitText": "MONTH"
    }
  },
};

export default function SEOHead({ title, description, path, image, type = "website", jsonLd }: SEOHeadProps) {
  const defaultImage = "https://lotterypro.app/og-default.png";
  const ogImage = image || defaultImage;
  const structuredData = jsonLd || defaultJsonLd;

  return (
    <Helmet>
      <title>{title} | LotteryPro</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={`https://lotterypro.app${path}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={`https://lotterypro.app${path}`} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="LotteryPro" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@LotteryProApp" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
