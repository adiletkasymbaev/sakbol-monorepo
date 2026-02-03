import React, { type SVGProps } from 'react';

interface IconHouseProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const IconHouse: React.FC<IconHouseProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M7.5 14.1666H12.5M2.5 12.1666V10.1084C2.5 9.15117 2.5 8.6725 2.62338 8.23173C2.73267 7.84128 2.91227 7.47405 3.15337 7.14807C3.42556 6.78007 3.80337 6.48622 4.55898 5.89852L6.72565 4.21334C7.89673 3.30249 8.48225 2.84707 9.12883 2.672C9.69933 2.51754 10.3007 2.51754 10.8712 2.672C11.5177 2.84707 12.1032 3.30249 13.2743 4.21334L15.441 5.89852C16.1967 6.48622 16.5744 6.78007 16.8466 7.14807C17.0878 7.47405 17.2673 7.84128 17.3766 8.23173C17.5 8.6725 17.5 9.15117 17.5 10.1084V12.1666C17.5 14.0334 17.5 14.9669 17.1367 15.6799C16.8171 16.3071 16.3072 16.8171 15.68 17.1367C14.9669 17.4999 14.0335 17.4999 12.1667 17.4999H7.83333C5.96649 17.4999 5.03308 17.4999 4.32003 17.1367C3.69283 16.8171 3.18289 16.3071 2.86331 15.6799C2.5 14.9669 2.5 14.0334 2.5 12.1666Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconHouse;