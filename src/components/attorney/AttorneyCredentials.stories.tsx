import type { Meta, StoryObj } from '@storybook/react'
import { AttorneyCredentials } from './AttorneyCredentials'
import type { AttorneyEnrichmentData } from '@/lib/attorney-enrichment'

const mockEnrichment: AttorneyEnrichmentData = {
  education: [
    {
      id: 'edu-1',
      attorney_id: 'att-1',
      institution: 'Harvard Law School',
      degree: 'Juris Doctor',
      graduation_year: 2010,
      honors: 'magna cum laude',
      is_verified: true,
      source_url: 'https://hls.harvard.edu',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'edu-2',
      attorney_id: 'att-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Arts, Political Science',
      graduation_year: 2007,
      honors: null,
      is_verified: false,
      source_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  awards: [
    {
      id: 'award-1',
      attorney_id: 'att-1',
      title: 'Super Lawyers Rising Star',
      issuer: 'Thomson Reuters',
      year: 2023,
      specialty_id: null,
      url: 'https://superlawyers.com',
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'award-2',
      attorney_id: 'att-1',
      title: 'Best Lawyers in America',
      issuer: 'Best Lawyers',
      year: 2022,
      specialty_id: null,
      url: null,
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'award-3',
      attorney_id: 'att-1',
      title: 'Pro Bono Service Award',
      issuer: 'Thomson Reuters',
      year: 2021,
      specialty_id: null,
      url: null,
      is_verified: false,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  publications: [
    {
      id: 'pub-1',
      attorney_id: 'att-1',
      title: 'The Future of AI Regulation in Corporate Law',
      publication_type: 'law_review',
      publisher: 'Harvard Law Review',
      published_date: '2023-06-15',
      url: 'https://harvardlawreview.org/example',
      doi: null,
      specialty_id: null,
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pub-2',
      attorney_id: 'att-1',
      title: 'Navigating SEC Compliance for Startups',
      publication_type: 'article',
      publisher: 'ABA Journal',
      published_date: '2022-11-01',
      url: null,
      doi: null,
      specialty_id: null,
      is_verified: false,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pub-3',
      attorney_id: 'att-1',
      title: 'Corporate Governance Best Practices',
      publication_type: 'book_chapter',
      publisher: 'Oxford University Press',
      published_date: '2021-03-20',
      url: null,
      doi: '10.1093/example',
      specialty_id: null,
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  disciplinary: [
    {
      id: 'disc-1',
      attorney_id: 'att-1',
      state: 'CA',
      action_type: 'private_reprimand',
      effective_date: '2019-05-10',
      end_date: null,
      description: 'Failure to promptly communicate settlement offer to client.',
      docket_number: 'SBC-2019-04532',
      source_url: 'https://www.calbar.ca.gov/example',
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
}

const meta: Meta<typeof AttorneyCredentials> = {
  title: 'Attorney/AttorneyCredentials',
  component: AttorneyCredentials,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AttorneyCredentials>

export const FullProfile: Story = {
  args: {
    enrichment: mockEnrichment,
  },
}

export const EducationOnly: Story = {
  args: {
    enrichment: {
      education: mockEnrichment.education,
      awards: [],
      publications: [],
      disciplinary: [],
    },
  },
}

export const AwardsOnly: Story = {
  args: {
    enrichment: {
      education: [],
      awards: mockEnrichment.awards,
      publications: [],
      disciplinary: [],
    },
  },
}

export const WithDisciplinaryRecord: Story = {
  args: {
    enrichment: {
      education: mockEnrichment.education,
      awards: [],
      publications: [],
      disciplinary: mockEnrichment.disciplinary,
    },
  },
}

export const EmptyProfile: Story = {
  args: {
    enrichment: {
      education: [],
      awards: [],
      publications: [],
      disciplinary: [],
    },
  },
}

export const ManyPublications: Story = {
  args: {
    enrichment: {
      education: [],
      awards: [],
      publications: Array.from({ length: 8 }, (_, i) => ({
        id: `pub-${i + 1}`,
        attorney_id: 'att-1',
        title: `Legal Research Paper #${i + 1}: Analysis of ${['Contract Law', 'Tort Reform', 'IP Rights', 'Employment Law', 'Tax Policy', 'Criminal Justice', 'Environmental Law', 'Civil Rights'][i]}`,
        publication_type: ['law_review', 'article', 'book_chapter', 'blog_post', 'article', 'law_review', 'book', 'article'][i],
        publisher: ['Harvard Law Review', 'ABA Journal', 'Oxford Press', 'Law.com', 'Yale Law Journal', 'Stanford Law Review', 'Cambridge Press', 'Legal Intelligencer'][i],
        published_date: `${2023 - i}-01-15`,
        url: i % 2 === 0 ? `https://example.com/pub-${i + 1}` : null,
        doi: null,
        specialty_id: null,
        is_verified: i < 4,
        created_at: '2024-01-01T00:00:00Z',
      })),
      disciplinary: [],
    },
  },
}
