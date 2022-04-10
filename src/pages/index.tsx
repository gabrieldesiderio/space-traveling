import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function formatPost(post) {
  return {
    uid: post.uid,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(post.data.title),
      subtitle: RichText.asText(post.data.subtitle),
      author: RichText.asText(post.data.author),
    },
  };
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function loadMore() {
    if (!nextPage) {
      return;
    }

    const response = await fetch(nextPage).then(response => response.json());

    const formattedPosts = response.results.map(post => {
      return formatPost(post);
    });

    setPosts([...posts, ...formattedPosts]);
    setNextPage(response.next_page);
  }

  return (
    <>
      <div className={commonStyles.container}>
        <div className={styles.container}>
          <img className={styles.logo} src="/logo.svg" alt="logo" />
          <div className={styles.posts}>
            {posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
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
                </a>
              </Link>
            ))}
          </div>
          {nextPage && (
            <button className={styles.button} onClick={loadMore}>
              Carregar mais posts
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 1 }
  );

  const posts = postsResponse.results.map(post => {
    return formatPost(post);
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
