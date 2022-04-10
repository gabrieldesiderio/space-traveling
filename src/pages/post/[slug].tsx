import { render } from '@testing-library/react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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

export default function Post(props: PostProps) {
  const { post } = props;

  return (
    <>
      <Header />
      <picture className={styles.picture}>
        <img src={post.data.banner.url} alt="thumbnail" />
      </picture>
      <div className={`${commonStyles.container} ${styles.container}`}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={styles.info}>
          <div>
            <FiCalendar />
            {post.first_publication_date}
          </div>
          <div>
            <FiUser />
            {post.data.author}
          </div>
        </div>
        <div className={styles.content}>
          {post.data.content.map(content => (
            <>
              <h2>{RichText.asText(content.heading)}</h2>
              <div dangerouslySetInnerHTML={{ __html:RichText.asHtml(content.body) }}></div>
            </>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}
// export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
//   const { slug } = params;

//   const prismic = getPrismicClient();
//   const response = await prismic.getByUID('post', String(slug), {});

//   if(!response) {
//     return {
//       notFound: true,
//     }
//   }

//   const post = {
//     first_publication_date: format(
//       new Date(response.first_publication_date),
//       'dd MMM yyyy',
//       {
//         locale: ptBR,
//       }
//     ),
//     data: {
//       title: RichText.asText(response.data.title),
//       banner: {
//         url: response.data.banner,
//       },
//       author: RichText.asText(response.data.author),
//       content: response.data.content,
//     },
//   };


//   return {
//     props: {
//       post,
//     },
//     revalidate: 60 * 60 * 24, // 24 hours
//   };
// };
