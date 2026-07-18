interface BlogMarkdownContentProps {
  content: string;
}

export default function BlogMarkdownContent({ content }: BlogMarkdownContentProps) {
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="prose prose-gray max-w-none space-y-5">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              {trimmed.replace(/^## /, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              {trimmed.replace(/^### /, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 rounded-r-lg">
              <p className="text-sm text-amber-800 leading-relaxed">
                {trimmed.replace(/^> \*\*/, "").replace(/\*\*/, ": ").replace(/\*\*/, "")}
              </p>
            </blockquote>
          );
        }
        if (trimmed.startsWith("- ") || /^\d+\. /.test(trimmed)) {
          const lines = trimmed.split("\n");
          return (
            <ul key={i} className="space-y-2 text-gray-700">
              {lines.map((line, li) => {
                const bullet = line.replace(/^[-\d]+\.?\s*/, "").trim();
                return bullet ? (
                  <li key={li} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1 shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                  </li>
                ) : null;
              })}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        );
      })}
    </div>
  );
}
