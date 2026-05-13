import React from 'react';

const NextLink = ({
  href,
  children,
  ...rest
}: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return React.createElement('a', { href, ...rest }, children);
};

export default NextLink;
