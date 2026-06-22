type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
};

export const Button = ({ children, onClick, variant = 'primary', className = '' }: Props) => {
  const baseStyle = "px-4 py-2 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg",
    secondary: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
    danger: "text-slate-200 hover:text-red-500",
    ghost: "bg-slate-100 text-slate-400"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};
