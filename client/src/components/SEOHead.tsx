import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
}

export default function SEOHead({ title, description, path, image, type = "website" }: SEOHeadProps) {
  const defaultImage = "https://lotterypro.app/og-default.png";
  const ogImage = image || defaultImage;

  return (
    <Helmet>
      <title>{title} | LotteryPro</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={`https://lotterypro.app${path}`} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="LotteryPro" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
