import React, { type SVGProps } from 'react';

interface IconMapPinProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const IconMapPin: React.FC<IconMapPinProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={26}
      height={26}
      viewBox="0 0 26 26"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M7.05 15.8333C5.47634 16.4333 4.5 17.2694 4.5 18.1942C4.5 20.02 8.30558 21.5 13 21.5C17.6945 21.5 21.5 20.02 21.5 18.1942C21.5 17.2694 20.5236 16.4333 18.95 15.8333M13 10.1667H13.0094M18.6667 10.1667C18.6667 14.0046 14.4167 15.8333 13 18.6667C11.5833 15.8333 7.33333 14.0046 7.33333 10.1667C7.33333 7.03705 9.87038 4.5 13 4.5C16.1296 4.5 18.6667 7.03705 18.6667 10.1667ZM13.9444 10.1667C13.9444 10.6883 13.5216 11.1111 13 11.1111C12.4784 11.1111 12.0556 10.6883 12.0556 10.1667C12.0556 9.64507 12.4784 9.22222 13 9.22222C13.5216 9.22222 13.9444 9.64507 13.9444 10.1667Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconMapPin;