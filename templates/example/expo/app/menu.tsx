import { MenuList } from '#/components/menu/menu-list'

// No server render on native: the query hook fetches on mount and the list shows its own loading state.
export default function MenuScreen() {
  return <MenuList />
}
