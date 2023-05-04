import React, { Component, Fragment } from "react";
import { Container } from "reactstrap";
import { NavMenu } from "./NavMenu";

export class Layout extends Component {
	static displayName = Layout.name;

	render() {
		return (
			<Fragment>
				<NavMenu />
				<Container className="main" tag="main">
					{this.props.children}
				</Container>
				<footer>
					MICROSOFT INTERNAL USE ONLY
				</footer>
			</Fragment>
		);
	}
}
