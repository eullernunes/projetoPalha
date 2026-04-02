interface Props {
  variant?: 'green' | 'red' | 'blue' | 'gray' | 'yellow'
  children: React.ReactNode
}

const variants = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-700',
}

export default function Badge({ variant = 'gray', children }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
