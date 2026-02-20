---
name: seo-optimization
description: Use when improving search engine visibility, conducting SEO audits, implementing structured data, optimizing Core Web Vitals for SEO, enhancing E-E-A-T signals, or developing GEO (Generative Engine Optimization) strategies. Triggers on SEO, search, ranking, meta, schema, sitemap, robots, E-E-A-T, Core Web Vitals, GEO, LLM visibility.
---

# SEO Optimization Skill

Comprehensive SEO and GEO (Generative Engine Optimization) for traditional and AI-powered search visibility.

## When to Use

### Trigger Symptoms (Use this skill when...)

- SEO audits needed
- Search rankings declining
- Implementing structured data
- Meta tag optimization
- Core Web Vitals issues affecting SEO
- AI search visibility (ChatGPT, Claude, Perplexity)
- E-E-A-T improvement
- Schema markup implementation

### Use ESPECIALLY when:

- New content strategy
- Site migration planned
- Algorithm update impact
- Competitor outranking
- Low click-through rates

### When NOT to Use

- Performance only → use `performance-optimization` skill
- Content writing → use domain-specific skills
- Technical bugs → use `debugger` skill

---

## Core Philosophy

> "Content for humans, structured for machines. Win both Google and ChatGPT."

---

## SEO vs GEO Comparison

| Aspect | SEO | GEO |
|--------|-----|-----|
| **Target** | Google, Bing | ChatGPT, Claude, Perplexity |
| **Goal** | Rank #1 | Be cited in responses |
| **Metrics** | Rankings, CTR | Citation rate, mentions |
| **Focus** | Keywords, backlinks | Entities, data, credentials |
| **Content** | Optimized text | Structured, factual data |

---

## Core Web Vitals (SEO Impact)

| Metric | Good | Poor | SEO Impact |
|--------|------|------|------------|
| **LCP** | ≤ 2.5s | > 4.0s | Ranking factor |
| **INP** | ≤ 200ms | > 500ms | Ranking factor |
| **CLS** | ≤ 0.1 | > 0.25 | Ranking factor |

---

## E-E-A-T Framework

| Principle | How to Demonstrate | Implementation |
|-----------|-------------------|----------------|
| **Experience** | First-hand knowledge | Case studies, testimonials |
| **Expertise** | Credentials | Author bios, certifications |
| **Authoritativeness** | Recognition | Backlinks, press mentions |
| **Trustworthiness** | Reliability | HTTPS, reviews, contact info |

---

## Technical SEO Checklist

### Essential

- [ ] XML sitemap submitted to Search Console
- [ ] robots.txt properly configured
- [ ] Canonical tags on all pages
- [ ] HTTPS enforced (301 redirects)
- [ ] Mobile-responsive design
- [ ] Core Web Vitals passing
- [ ] No 404 errors (check broken links)

### Page-Level

- [ ] Title tags (50-60 chars, unique)
- [ ] Meta descriptions (150-160 chars)
- [ ] H1-H6 hierarchy correct
- [ ] Internal linking structure
- [ ] Image alt texts
- [ ] Open Graph tags
- [ ] Twitter Card tags

---

## Schema Markup Priority

| Type | When to Use | SEO Value |
|------|-------------|-----------|
| **Organization** | All sites | High |
| **WebSite** | All sites | High |
| **BreadcrumbList** | All pages | Medium |
| **Article** | Blog posts | High |
| **Product** | E-commerce | Critical |
| **FAQ** | Q&A content | High (GEO) |
| **HowTo** | Tutorials | High (GEO) |
| **LocalBusiness** | Local SEO | Critical |

### Example Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": {
    "@type": "Person",
    "name": "Expert Name",
    "url": "https://example.com/author"
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-20",
  "image": "https://example.com/image.jpg"
}
```

---

## GEO (AI Search) Optimization

### Content That Gets Cited

| Element | Why AI Cites It |
|---------|-----------------|
| Original statistics | Unique data points |
| Expert quotes | Authority signals |
| Clear definitions | Extractable facts |
| Step-by-step guides | Useful procedures |
| Comparison tables | Structured data |
| "Last updated" | Freshness signal |

### GEO Checklist

- [ ] FAQ sections present
- [ ] Author credentials visible
- [ ] Statistics with sources
- [ ] Clear definitions of terms
- [ ] Expert quotes attributed
- [ ] "Last updated" timestamps
- [ ] Structured data implemented

---

## Meta Tag Templates

### Title Tag

```
Primary Keyword | Secondary Keyword | Brand Name
Length: 50-60 characters
```

### Meta Description

```
Action verb + benefit + unique value proposition + call to action.
Length: 150-160 characters
```

### Open Graph

```html
<meta property="og:title" content="Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="article">
```

---

## Internal Linking Strategy

### Principles

1. **Hub pages** link to related content
2. **Every page** reachable in 3 clicks
3. **Anchor text** descriptive (not "click here")
4. **Link juice** flows to important pages

### Structure

```
Homepage
├── Category A (hub)
│   ├── Article 1
│   ├── Article 2
│   └── Article 3
├── Category B (hub)
│   └── ...
└── About (links to all categories)
```

---

## Robots.txt Template

```
User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Sitemap location
Sitemap: https://example.com/sitemap.xml
```

---

## SEO Audit Workflow

### Step 1: Technical Audit

- [ ] Crawl errors
- [ ] Index coverage
- [ ] Mobile usability
- [ ] Core Web Vitals
- [ ] HTTPS issues

### Step 2: On-Page Audit

- [ ] Title tags optimized
- [ ] Meta descriptions unique
- [ ] H1 structure correct
- [ ] Image alt tags present
- [ ] Internal links working

### Step 3: Content Audit

- [ ] Thin content identified
- [ ] Duplicate content found
- [ ] Keyword gaps analyzed
- [ ] Content freshness checked

### Step 4: Off-Page Audit

- [ ] Backlink profile analyzed
- [ ] Toxic links disavowed
- [ ] Competitor backlinks researched

---

## Reporting Template

### SEO Health Score

| Category | Score | Issues |
|----------|-------|--------|
| Technical | X/100 | Y issues |
| On-Page | X/100 | Y issues |
| Content | X/100 | Y issues |
| Off-Page | X/100 | Y issues |

### Priority Fixes

1. [Critical issue with impact]
2. [High priority issue]
3. [Medium priority improvement]

---

## Quick Commands

```bash
# Check indexed pages
site:example.com

# Check robots.txt
curl https://example.com/robots.txt

# Validate schema
https://search.google.com/test/rich-results

# Check Core Web Vitals
npx lighthouse https://example.com --view

# Search Console
https://search.google.com/search-console
```

---

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Keyword stuffing | Natural language |
| Buy backlinks | Earn quality links |
| Hide text | Visible content |
| Duplicate content | Canonical tags |
| Ignore mobile | Mobile-first design |
| Skip schema | Implement structured data |

---

## Quality Checklist

### Technical

- [ ] XML sitemap exists and submitted
- [ ] robots.txt allows crawling
- [ ] All pages use HTTPS
- [ ] No broken links
- [ ] Core Web Vitals pass

### On-Page

- [ ] All pages have unique titles
- [ ] Meta descriptions present
- [ ] H1 tags used correctly
- [ ] Images have alt text
- [ ] Schema markup valid

### GEO

- [ ] Author information visible
- [ ] Statistics sourced
- [ ] Definitions clear
- [ ] FAQs present where appropriate
- [ ] Last updated shown
