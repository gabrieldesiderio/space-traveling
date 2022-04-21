import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Prismic from '@prismicio/client'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { Head } from 'next/document';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Header />
        <div className={`${commonStyles.container} ${styles.container}`}>
          <h4>Carregando...</h4>
        </div>
      </>
    );
  }

  const publicationDate = format(
    new Date(post?.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const readingTime = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body);
    const split = textBody.split(' ');
    const words = split.length;

    const result = Math.ceil(words / 200);
    return acc + result;
  }, 0);

  const contentBlocks = post.data.content.map(block => {
    return {
      heading: RichText.asText(block.heading),
      body: RichText.asHtml(block.body)
    }
  });

  return (
    <>
      <Header />
      <picture className={styles.picture}>
        <img src={post?.data.banner.url} alt="thumbnail" />
      </picture>
      <div className={`${commonStyles.container} ${styles.container}`}>
        <h1 className={styles.title}>{post?.data.title}</h1>
        <div className={styles.info}>
          <div>
            <FiCalendar />
            {publicationDate}
          </div>
          <div>
            <FiUser />
            {post?.data.author}
          </div>
          <div>
            <FiClock />
            { readingTime } min
          </div>
        </div>
        <div className={styles.content}>
          {contentBlocks.map(block => (
            <div key={block.heading}>
              <h2>{block.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: String(block.body),
                }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 2,
      fetch: ['post.uid']
    }
  );

  const slugs = postsResponse.results.map(post => ({
    params: {
      slug: post.uid
    }
  }))

  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response?.first_publication_date,
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
