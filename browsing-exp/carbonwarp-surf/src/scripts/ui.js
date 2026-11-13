/* Class strings shared between .astro markup and the DOM built in scripts. */

/* Custom checkbox. Add checked:border-* / checked:bg-* / checked:after:text-* where it is used. */
export const CHECKBOX =
  'appearance-none grid size-[17px] flex-none cursor-pointer place-items-center rounded-[5px] border-[1.5px] border-faintest bg-transparent ' +
  "checked:after:content-['✓'] checked:after:text-[12px] checked:after:leading-none checked:after:font-extrabold " +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
