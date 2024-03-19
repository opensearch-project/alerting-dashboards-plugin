export const esDriverMock = jest.fn();
esDriverMock.call = jest.fn();
esDriverMock.asScoped = jest.fn().mockReturnValue({
  callAsCurrentUser: esDriverMock.call,
});

export const responseMock = jest.fn();
responseMock.ok = jest.fn().mockImplementation((obj) => obj);
