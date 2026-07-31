import type { ComponentProps } from "react";

type IconProps = Omit<ComponentProps<"img">, "src">;

const createIcon = (name: string) => {
  const Icon = ({ alt = "", className = "", ...props }: IconProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${name}.svg`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`transition-[filter,opacity] duration-200 dark:brightness-0 dark:invert dark:opacity-90 group-[&.menu-item-active]:opacity-100 group-[&.menu-item-active]:[filter:brightness(0)_saturate(100%)_invert(36%)_sepia(90%)_saturate(1200%)_hue-rotate(213deg)_brightness(98%)_contrast(98%)] ${className}`}
      {...props}
    />
  );

  Icon.displayName = `${name}Icon`;
  return Icon;
};

export const GridIcon = createIcon("grid");
export const BoxCubeIcon = createIcon("box-cube");
export const GroupIcon = createIcon("group");
export const CalenderIcon = createIcon("calender-line");
export const ListIcon = createIcon("list");
export const PieChartIcon = createIcon("pie-chart");
export const PlusIcon = createIcon("plus");
export const PencilIcon = createIcon("pencil");
export const ChevronDownIcon = createIcon("chevron-down");
export const HorizontaLDots = createIcon("horizontal-dots");
export const UserCircleIcon = createIcon("user-circle");
export const DollarLineIcon = createIcon("dollar-line");
export const CheckLineIcon = createIcon("check-line");
export const CloseLineIcon = createIcon("close-line");
export const TaskIcon = createIcon("task-icon");
export const ArrowUpIcon = createIcon("arrow-up");
export const ArrowDownIcon = createIcon("arrow-down");
