import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

/**
 * Get OpenAI client instance (lazy initialization)
 */
function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// Export for backward compatibility
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as any)[prop];
  },
});

/**
 * Generate chat completion with streaming support
 */
export async function generateChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1000,
    stream = false,
  } = options || {};

  return await getOpenAIClient().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  });
}

/**
 * Generate text summary for a given content
 */
export async function generateSummary(
  content: string,
  maxLength: number = 150
): Promise<string> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that creates concise summaries. 
        Generate a summary that is approximately ${maxLength} characters or less.`,
      },
      {
        role: 'user',
        content: `Please summarize the following content:\n\n${content}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate blog post content based on a topic
 */
export async function generateBlogPost(
  topic: string,
  options?: {
    tone?: 'professional' | 'casual' | 'technical';
    length?: 'short' | 'medium' | 'long';
  }
): Promise<{ title: string; content: string; tags: string[] }> {
  const { tone = 'professional', length = 'medium' } = options || {};

  const lengthGuide = {
    short: '500-800 words',
    medium: '1000-1500 words',
    long: '2000-3000 words',
  };

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert blog writer. Generate high-quality blog posts in Markdown format.
        Use a ${tone} tone and aim for ${lengthGuide[length]}.
        Include a title, well-structured content with headings, and suggest relevant tags.
        Format your response as JSON with keys: title, content, tags.`,
      },
      {
        role: 'user',
        content: `Write a blog post about: ${topic}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return {
    title: result.title || '',
    content: result.content || '',
    tags: result.tags || [],
  };
}

/**
 * Moderate comment content for spam and inappropriate content
 */
export async function moderateContent(
  content: string
): Promise<{
  flagged: boolean;
  categories: any;
  categoryScores: any;
}> {
  const response = await getOpenAIClient().moderations.create({
    input: content,
  });

  const result = response.results[0];
  return {
    flagged: result.flagged,
    categories: result.categories as any,
    categoryScores: result.category_scores as any,
  };
}

/**
 * Analyze SEO aspects of a blog post
 */
export async function analyzeSEO(
  title: string,
  content: string
): Promise<{
  score: number;
  suggestions: string[];
  keywords: string[];
}> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an SEO expert. Analyze the given blog post and provide:
        1. An SEO score (0-100)
        2. Specific suggestions for improvement
        3. Recommended keywords
        Format your response as JSON with keys: score, suggestions, keywords.`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return {
    score: result.score || 0,
    suggestions: result.suggestions || [],
    keywords: result.keywords || [],
  };
}

/**
 * Generate recommendations based on post content and user history
 */
export async function generateRecommendations(
  currentPost: { title: string; content: string; tags: string[] },
  availablePosts: Array<{ id: string; title: string; excerpt: string; tags: string[] }>,
  limit: number = 5
): Promise<string[]> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a recommendation engine. Given a current post and a list of available posts, 
        suggest the ${limit} most relevant posts. Return only the post IDs as a JSON array.`,
      },
      {
        role: 'user',
        content: `Current post: ${currentPost.title}\nTags: ${currentPost.tags.join(', ')}
        
        Available posts:
        ${availablePosts.map((p) => `ID: ${p.id}, Title: ${p.title}, Tags: ${p.tags.join(', ')}`).join('\n')}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{"recommendations": []}');
  return result.recommendations || [];
}
