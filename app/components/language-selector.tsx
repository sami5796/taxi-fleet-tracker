"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLanguage, type Language } from "../contexts/language-context"

const languages = [
  { code: "en" as Language, name: "English", flag: "🇺🇸" },
  { code: "no" as Language, name: "Norsk", flag: "🇳🇴" },
  { code: "ur" as Language, name: "اردو", flag: "🇵🇰" },
  { code: "so" as Language, name: "Soomaali", flag: "🇸🇴" },
  { code: "ti" as Language, name: "ትግርኛ", flag: "🇪🇷" },
  { code: "ar" as Language, name: "العربية", flag: "🇸🇦" },
  { code: "hi" as Language, name: "हिन्दी", flag: "🇮🇳" },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white">
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? "bg-blue-50" : ""}`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
