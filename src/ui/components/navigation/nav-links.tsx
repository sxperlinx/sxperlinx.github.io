'use client';

import { HomeIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/lib/props';
import { Element } from '@/lib/types';
import cn from '@/lib/utils';
import Link from 'next/link';
import React from 'react';
import clsx from 'clsx';

/**
 * Array of links/routes to include in navigation.
 */
const links: NavLink[] = [{ name: 'Home', href: '/', icon: HomeIcon }];

/**
 * Reusable component for navigations, it allows to simply build your navigation around this component.
 * No matter if it is a sidenav, topnav or any other kind of navigation.
 */
export default function NavLinks({
	className,
}: {
	className?: string;
}): Element {
	const pathname = usePathname();

	return (
		<>
			{links.map((link) => {
				const LinkIcon = link.icon;

				return (
					<Link
						key={link.name}
						href={link.href}
						className={cn(
							clsx(
								'md:transition-color flex h-[48px] grow items-center justify-center gap-2 rounded-md border-2 p-3 text-sm font-medium md:flex-none md:justify-start md:p-2 md:px-3',
								{
									'': pathname === link.href,
									'': pathname !== link.href,
								},
							),
							className,
						)}
					>
						<LinkIcon className='w-6' />
						<p className='hidden md:block'>{link.name}</p>
					</Link>
				);
			})}
		</>
	);
}
