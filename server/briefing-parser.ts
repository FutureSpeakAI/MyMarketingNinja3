interface ParsedDeliverable {
  id: string;
  type: 'content' | 'visual';
  title: string;
  description: string;
  requirements?: string;
  status: 'pending' | 'in_progress' | 'completed';
  linkedAssetId?: number;
}

interface ParsedBriefing {
  deliverables: ParsedDeliverable[];
  objectives: string[];
  targetAudience: string;
  keyMessages: string[];
}

export function parseBriefingDeliverables(briefingContent: string): ParsedBriefing {
  const deliverables: ParsedDeliverable[] = [];
  const objectives: string[] = [];
  let targetAudience = '';
  const keyMessages: string[] = [];

  // Strip HTML tags for easier parsing
  const cleanContent = briefingContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n');

  // Extract objectives
  const objectivesMatch = cleanContent.match(/(?:Objectives?|Goals?)[:\s]*\n((?:.+\n)*?)(?:\n[A-Z]|$)/i);
  if (objectivesMatch) {
    const objectivesList = objectivesMatch[1];
    const objectiveItems = objectivesList.match(/(?:•|-|\*|\d+\.)\s*(.+)/g);
    if (objectiveItems) {
      objectives.push(...objectiveItems.map(item => item.replace(/^(?:•|-|\*|\d+\.)\s*/, '').trim()));
    }
  }

  // Extract target audience
  const audienceMatch = cleanContent.match(/(?:Target Audience|Audience)[:\s]*\n(.+?)(?:\n[A-Z]|$)/i);
  if (audienceMatch) {
    targetAudience = audienceMatch[1].trim();
  }

  // Extract key messages
  const messagesMatch = cleanContent.match(/(?:Key Messages?|Messages?)[:\s]*\n((?:.+\n)*?)(?:\n[A-Z]|$)/i);
  if (messagesMatch) {
    const messagesList = messagesMatch[1];
    const messageItems = messagesList.match(/(?:•|-|\*|\d+\.)\s*(.+)/g);
    if (messageItems) {
      keyMessages.push(...messageItems.map(item => item.replace(/^(?:•|-|\*|\d+\.)\s*/, '').trim()));
    }
  }

  // Parse deliverables section (handle both HTML and plain text)
  const deliverablesMatch = cleanContent.match(/(?:Deliverables?)[:\s]*\n((?:.+\n)*?)(?:\n[A-Z]|$)/i);
  if (deliverablesMatch) {
    const deliverablesSection = deliverablesMatch[1];
    
    // Look for blog posts
    if (deliverablesSection.match(/blog\s*post/i)) {
      const blogMatch = deliverablesSection.match(/blog\s*post[:\s]*\(?\s*(\d+\-?\d*)\s*words?\)?/i);
      const wordCount = blogMatch ? blogMatch[1] : '800-1000';
      deliverables.push({
        id: 'blog-post-1',
        type: 'content',
        title: 'Blog Post',
        description: `Blog post content (${wordCount} words)`,
        requirements: 'SEO-optimized, mobile-first formatting, include pricing and release information',
        status: 'pending'
      });
    }

    // Look for hero image
    if (deliverablesSection.match(/hero\s*image/i)) {
      deliverables.push({
        id: 'hero-image-1',
        type: 'visual',
        title: 'Hero Image',
        description: 'High resolution hero image for campaign',
        requirements: 'Min 2000px wide, .jpg or .png format, sRGB color space, 90%+ quality',
        status: 'pending'
      });
    }

    // Look for product images
    const imageMatches = deliverablesSection.match(/(?:three|3)\s*(?:product\s*)?images?/i);
    if (imageMatches) {
      deliverables.push(
        {
          id: 'product-image-1',
          type: 'visual',
          title: 'Product Image - Side View',
          description: 'Side view showcasing shoe silhouette with Volkswagen Beetle backdrop',
          status: 'pending'
        },
        {
          id: 'product-image-2',
          type: 'visual',
          title: 'Product Image - Close-up',
          description: 'Close-up highlighting materials, design details, and branding',
          status: 'pending'
        },
        {
          id: 'product-image-3',
          type: 'visual',
          title: 'Product Image - Lifestyle',
          description: 'Lifestyle image of young professional wearing shoe in urban setting',
          status: 'pending'
        }
      );
    }
  }

  // Also check for detailed image descriptions in the content
  const angleMatches = briefingContent.match(/Angle\s+\d+:\s*(.+?)(?:\n|$)/g);
  if (angleMatches && deliverables.filter(d => d.type === 'visual').length === 0) {
    angleMatches.forEach((angleMatch, index) => {
      const description = angleMatch.replace(/Angle\s+\d+:\s*/i, '').trim();
      deliverables.push({
        id: `visual-angle-${index + 1}`,
        type: 'visual',
        title: `Visual Asset ${index + 1}`,
        description: description,
        status: 'pending'
      });
    });
  }

  // Look for social media content
  if (briefingContent.match(/social\s*media/i)) {
    deliverables.push({
      id: 'social-media-1',
      type: 'content',
      title: 'Social Media Content',
      description: 'Social media posts with campaign hashtags and engagement content',
      status: 'pending'
    });
  }

  return {
    deliverables,
    objectives,
    targetAudience,
    keyMessages
  };
}

export function matchDeliverablesWithAssets(
  parsedDeliverables: ParsedDeliverable[],
  linkedContent: any[],
  linkedProjects: any[]
): ParsedDeliverable[] {
  const result = [...parsedDeliverables];

  // Match content deliverables
  const contentDeliverables = result.filter(d => d.type === 'content');
  contentDeliverables.forEach((deliverable, index) => {
    if (linkedContent[index]) {
      deliverable.linkedAssetId = linkedContent[index].id;
      deliverable.status = 'completed';
    }
  });

  // Match visual deliverables
  const visualDeliverables = result.filter(d => d.type === 'visual');
  visualDeliverables.forEach((deliverable, index) => {
    if (linkedProjects[index]) {
      deliverable.linkedAssetId = linkedProjects[index].id;
      deliverable.status = 'completed';
    }
  });

  return result;
}