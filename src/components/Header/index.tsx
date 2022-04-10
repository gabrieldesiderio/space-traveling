import commonStyles from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header() {
  return (
    <div className={commonStyles.container}>
      <img className={styles.logo} src="/logo.svg" alt="logo" />
    </div>
  );
}
