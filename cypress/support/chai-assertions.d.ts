/// <reference types="cypress" />
/// <reference types="chai" />

declare namespace Chai {
  interface Assertion {
    (selector: string): Assertion;
  }

  interface Include {
    (value: any): Assertion;
  }

  interface To {
    (value: any): Assertion;
  }
}

// Augmenter les types globaux pour supporter Chai dans Cypress
declare global {
  namespace Cypress {
    interface Chainer<Subject> {
      (chainer: 'be.at.most', value: number): Chainable<Subject>;
      (chainer: 'be.at.least', value: number): Chainable<Subject>;
      (chainer: 'not.be.empty'): Chainable<Subject>;
      (chainer: 'have.length.at.least', value: number): Chainable<Subject>;
    }
  }
}

export {};
