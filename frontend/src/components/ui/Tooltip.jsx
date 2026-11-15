import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * Étiquette flottante accessible (souris + clavier), utilisée notamment par la
 * barre latérale repliée. Quand `disabled` est vrai, l'enfant est rendu tel quel.
 */
export default function Tooltip({ label, children, side = 'right', disabled = false, delay = 300 }) {
  if (disabled || !label) return children;
  return (
    <RadixTooltip.Provider delayDuration={delay} skipDelayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="ui-tooltip" side={side} sideOffset={8} collisionPadding={8}>
            {label}
            <RadixTooltip.Arrow className="ui-tooltip-fleche" width={10} height={5} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
