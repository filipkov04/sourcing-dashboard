interface SaltoLogoProps {
  className?: string;
  size?: number;
}

export function SaltoLogo({ className, size = 32 }: SaltoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/salto-logo.png"
      alt="Salto"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
