import React from "react";

export const Button: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
	// simple, easily replaceable button component
	return (
		<button className={`px-4 py-2 bg-blue-600 text-white rounded ${className ?? ""}`}>
			{children}
		</button>
	);
};
