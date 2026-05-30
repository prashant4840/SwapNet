import { useEffect } from 'react'

interface MetadataProps {
  title: string
  description: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'profile' | 'article'
}

export function useDocumentMetadata({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://skillbridge-mu-green.vercel.app/og-image.png',
  ogType = 'website',
}: MetadataProps) {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes('SwapNet') ? title : `${title} | SwapNet`
    document.title = formattedTitle

    const siteUrl = 'https://skillbridge-mu-green.vercel.app'
    const fullCanonical = canonicalUrl || `${siteUrl}${window.location.pathname}`

    // 2. Helper to set or create meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // 3. Set standard descriptions
    setMetaTag('name', 'description', description)

    // 4. Set Open Graph (Facebook / LinkedIn / Slack)
    setMetaTag('property', 'og:title', formattedTitle)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:type', ogType)
    setMetaTag('property', 'og:url', fullCanonical)
    setMetaTag('property', 'og:image', ogImage)
    setMetaTag('property', 'og:site_name', 'SwapNet')

    // 5. Set Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', formattedTitle)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', ogImage)

    // 6. Set Canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', fullCanonical)
  }, [title, description, canonicalUrl, ogImage, ogType])
}
