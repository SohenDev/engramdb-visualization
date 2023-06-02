import { css, cx } from '@emotion/css';
import { useLingui } from '@lingui/react';
import { Item } from '@react-stately/collections';
import React, { ReactNode } from 'react';

import { GrafanaTheme2, locationUtil, NavMenuItemType, NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { IconName, useTheme2 } from '@grafana/ui';

import { NavBarItemMenu } from './NavBarItemMenu';
import { NavBarItemMenuTrigger } from './NavBarItemMenuTrigger';
import { getNavBarItemWithoutMenuStyles, NavBarItemWithoutMenu } from './NavBarItemWithoutMenu';
import { NavBarMenuItem } from './NavBarMenuItem';
import menuItemTranslations from './navBarItem-translations';
import { getNavModelItemKey } from './utils';

export interface Props {
  isActive?: boolean;
  children: ReactNode;
  className?: string;
  reverseMenuDirection?: boolean;
  showMenu?: boolean;
  link: NavModelItem;
}

const NavBarItem = ({
  isActive = false,
  children,
  className,
  reverseMenuDirection = false,
  showMenu = true,
  link,
}: Props) => {
  const { i18n } = useLingui();
  const theme = useTheme2();
  const menuItems = link.children ?? [];

  // Spreading `menuItems` here as otherwise we'd be mutating props
  const menuItemsSorted = reverseMenuDirection ? [...menuItems].reverse() : menuItems;
  const filteredItems = menuItemsSorted
    .filter((item) => !item.hideFromMenu)
    .map((i) => ({ ...i, menuItemType: NavMenuItemType.Item }));
  const adjustHeightForBorder = filteredItems.length === 0;
  const styles = getStyles(theme, adjustHeightForBorder, isActive);
  const section: NavModelItem = {
    ...link,
    children: filteredItems,
    menuItemType: NavMenuItemType.Section,
  };
  const items: NavModelItem[] = [section].concat(filteredItems);

  const onNavigate = (item: NavModelItem) => {
    const { url, target, onClick } = item;
    if (!url) {
      onClick?.();
      return;
    }

    if (!target && url.startsWith('/')) {
      locationService.push(locationUtil.stripBaseFromUrl(url));
    } else {
      window.open(url, target);
    }
  };

  const translationKey = link.id && menuItemTranslations[link.id];
  const linkText = translationKey ? i18n._(translationKey) : link.text;

  return showMenu ? (
    <li className={cx(styles.container, className)}>
      <NavBarItemMenuTrigger item={section} isActive={isActive} label={linkText}>
        <NavBarItemMenu
          items={items}
          reverseMenuDirection={reverseMenuDirection}
          adjustHeightForBorder={adjustHeightForBorder}
          disabledKeys={['divider', 'subtitle']}
          aria-label={section.text}
          onNavigate={onNavigate}
        >
          {(item: NavModelItem) => {
            const translationKey = item.id && menuItemTranslations[item.id];
            const itemText = translationKey ? i18n._(translationKey) : item.text;

            if (item.menuItemType === NavMenuItemType.Section) {
              return (
                <Item key={getNavModelItemKey(item)} textValue={item.text}>
                  <NavBarMenuItem
                    target={item.target}
                    text={itemText}
                    url={item.url}
                    onClick={item.onClick}
                    styleOverrides={styles.header}
                  />
                </Item>
              );
            }

            return (
              <Item key={getNavModelItemKey(item)} textValue={item.text}>
                <NavBarMenuItem
                  isDivider={item.divider}
                  icon={item.icon as IconName}
                  onClick={item.onClick}
                  target={item.target}
                  text={itemText}
                  url={item.url}
                  styleOverrides={styles.item}
                />
              </Item>
            );
          }}
        </NavBarItemMenu>
      </NavBarItemMenuTrigger>
    </li>
  ) : (
    <NavBarItemWithoutMenu
      label={link.text}
      className={className}
      isActive={isActive}
      url={link.url}
      onClick={link.onClick}
      target={link.target}
      highlightText={link.highlightText}
    >
      {children}
    </NavBarItemWithoutMenu>
  );
};

export default NavBarItem;

const getStyles = (theme: GrafanaTheme2, adjustHeightForBorder: boolean, isActive?: boolean) => ({
  ...getNavBarItemWithoutMenuStyles(theme, isActive),
  header: css`
    color: ${theme.colors.text.primary};
    height: ${theme.components.sidemenu.width - (adjustHeightForBorder ? 2 : 1)}px;
    font-size: ${theme.typography.h4.fontSize};
    font-weight: ${theme.typography.h4.fontWeight};
    padding: ${theme.spacing(1)} ${theme.spacing(2)};
    white-space: nowrap;
    width: 100%;
  `,
  item: css`
    color: ${theme.colors.text.primary};
  `,
});