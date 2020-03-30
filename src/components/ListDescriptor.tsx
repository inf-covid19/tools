import React, { Fragment } from "react";

export default function ListDescriptor({ children }: React.PropsWithChildren<{}>) {
  const effectiveChildren = React.Children.toArray(children);

  return (
    <Fragment>
      {effectiveChildren.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < effectiveChildren.length - 2 ? ", " : index < effectiveChildren.length - 1 ? " and " : ""}
        </Fragment>
      ))}
    </Fragment>
  );
}
