import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { testRouter } from './next-navigation';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
}

/** next/link, reduced to an anchor that drives the test router. */
export default function Link({ href, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onClick?.(event);
        testRouter.push(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
