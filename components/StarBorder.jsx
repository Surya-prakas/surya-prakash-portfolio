/*
  StarBorder
  ----------------------------------------------------
  Adapted from React Bits' "Star Border" (reactbits.dev). Upstream is a
  TypeScript/Tailwind snippet with a `color` prop and a self-contained
  `.inner-content` box; here it is plain JSX, the colour comes from the
  --accent-teal-* tokens in globals.css, and the inner box is whatever child is
  passed in -- so it can ring an existing .card instead of replacing it.

  Two radial-gradient "stars" sweep along the top and bottom edges. The wrapper
  clips them (overflow: hidden) and reveals only its own 1px padding, so what
  the eye gets is a light travelling around a hairline border rather than two
  blobs sliding across the card.

  Used on exactly one element: the fraud-detection project card. The motif is
  Nova's origin story ("a burst of light, a star waking up"), so this is a
  deliberate highlight on the flagship project -- not a card style. Applying it
  to a second card would cost it that meaning.

  The sweeps are fixed-height rather than upstream's `height: 50%`: upstream
  sizes for a ~50px button, where half the height still puts the gradient's
  bright centre near the edge. On a ~700px project card 50% would park the
  centre 175px inside the card, and the 1px ring would only ever catch the
  gradient's faint outer falloff.
*/
export default function StarBorder({ children }) {
  return (
    <div className="star-border">
      <span className="star-border-sweep star-border-sweep--top" aria-hidden="true" />
      <span className="star-border-sweep star-border-sweep--bottom" aria-hidden="true" />
      <div className="star-border-inner">{children}</div>
    </div>
  );
}
