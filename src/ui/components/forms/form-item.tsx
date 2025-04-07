import { FormItemProps } from '@/lib/props';
import { Element } from '@/lib/types';

export default function FormItem({
	children,
	label,
	...props
}: FormItemProps): Element {
	return (
		<fieldset
			className='my-2 flex h-10 w-fit flex-col items-center justify-start gap-1.5 rounded-sm p-1.5'
			{...props}
		>
			<label
				htmlFor={label.toLowerCase()}
				className='text-sm font-semibold'
			>
				{label}
			</label>
			{children}
		</fieldset>
	);
}
