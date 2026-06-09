import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type NavLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    className?: string;
    children: ReactNode;
  };

/**
 * Drop-in replacement for react-router's <NavLink>: renders a next/link
 * and appends the `active` class when the current path matches `href`
 * (exact, or a sub-path), reproducing react-router v6's default behaviour.
 */
export default function NavLink({
  href,
  className = '',
  children,
  ...rest
}: NavLinkProps) {
  const { asPath } = useRouter();
  const path = asPath.split(/[?#]/)[0];
  const hrefStr = typeof href === 'string' ? href : (href.pathname ?? '');
  const isActive =
    path === hrefStr || (hrefStr !== '/' && path.startsWith(`${hrefStr}/`));

  return (
    <Link
      href={href}
      className={`${className}${isActive ? ' active' : ''}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
