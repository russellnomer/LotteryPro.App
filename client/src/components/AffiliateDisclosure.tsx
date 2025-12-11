export default function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p 
      className={`text-xs font-bold ${className}`}
      style={{ color: "#DC3545", fontSize: "12px" }}
    >
      #ad Affiliate link: I may earn a commission from qualifying purchases at no extra cost to you (FTC compliant).
    </p>
  );
}
