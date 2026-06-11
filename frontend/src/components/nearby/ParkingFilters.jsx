import { styles } from './nearbyStyles';

// Sort + favorites filter buttons — one row, identical visual style.
// The favorites button behaves exactly like the sort buttons (same size, same
// active highlight) but it is a separate toggle, not a sort option.
function ParkingFilters({ selectedSort, onSortChange, showFavoritesOnly, onToggleFavoritesOnly, t }) {
  const sortOptions = [
    { label: t.nearby.default,  value: 'default',  testId: 'sort-by-default'  },
    { label: t.nearby.closest,  value: 'distance', testId: 'sort-by-distance' },
    { label: t.nearby.cheapest, value: 'price',    testId: 'sort-by-price'    },
  ];

  return (
    <div style={styles.sortRow}>
      {sortOptions.map(({ label, value, testId }) => (
        <button
          key={value}
          data-testid={testId}
          onClick={() => onSortChange(value)}
          style={selectedSort === value ? styles.sortBtnActive : styles.sortBtn}
        >
          {label}
        </button>
      ))}

      {/* Favorites filter — toggles independently of the sort selection */}
      <button
        onClick={onToggleFavoritesOnly}
        style={showFavoritesOnly ? styles.sortBtnActive : styles.sortBtn}
      >
        {t.nearby.favorites}
      </button>
    </div>
  );
}

export default ParkingFilters;
