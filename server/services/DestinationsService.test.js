import DestinationsService from "./DestinationsService";

describe("Test DestinationsService -- getDestinations", () => {
  let destinationsService;
  let mockContext;
  let mockReq;
  let mockRes;
  let mockClient;

  beforeEach(() => {
    mockClient = jest.fn();
    
    mockContext = {};
    
    mockRes = {
      ok: jest.fn().mockReturnValue({ body: {} }),
    };

    destinationsService = new DestinationsService();
    destinationsService.getClientBasedOnDataSource = jest.fn().mockReturnValue(mockClient);
  
  });

  describe("Test getDestinations", () => {
  
    test("should successfully get destinations list -- name as sort string", async () => {
      const mockReq = {
        query: {
          from: 0,
          size: 20,
          search: "",
          sortDirection: "desc",
          sortField: "name",
          type: "ALL",
        },
      };

      const mockResponse = {
        destinations: [{
          id: "1",
          name: "Sample Destination",
          schema_version: 1,
          seq_no: 1,
          primary_term: 1,
        }],
        totalDestinations: 1,
      };
      mockClient.mockResolvedValueOnce(mockResponse);

      await destinationsService.getDestinations(mockContext, mockReq, mockRes);

      expect(mockClient).toHaveBeenCalledWith("alerting.searchDestinations", {
        sortString: "destination.name.keyword",
        sortOrder: "desc",
        startIndex: 0,
        size: 20,
        searchString: "",
        destinationType: "ALL",
      });
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: {
          ok: true,
          destinations: [{
            id: "1",
            name: "Sample Destination",
            schema_version: 1,
            seq_no: 1,
            primary_term: 1,
            version: 1,
            ifSeqNo: 1,
            ifPrimaryTerm: 1,
          }],
          totalDestinations: 1,
        },
      });
    });

    test("should successfully get destinations list -- type as sort string", async () => {
      const mockReq = {
        query: {
          from: 0,
          size: 20,
          search: "",
          sortDirection: "desc",
          sortField: "type",
          type: "ALL",
        },
      };

      const mockResponse = {
        destinations: [{
          id: "1",
          name: "Sample Destination",
          schema_version: 1,
          seq_no: 1,
          primary_term: 1,
        }],
        totalDestinations: 1,
      };
      mockClient.mockResolvedValueOnce(mockResponse);

      await destinationsService.getDestinations(mockContext, mockReq, mockRes);

      expect(mockClient).toHaveBeenCalledWith("alerting.searchDestinations", {
        sortString: "destination.type",
        sortOrder: "desc",
        startIndex: 0,
        size: 20,
        searchString: "",
        destinationType: "ALL",
      });
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: {
          ok: true,
          destinations: [{
            id: "1",
            name: "Sample Destination",
            schema_version: 1,
            seq_no: 1,
            primary_term: 1,
            version: 1,
            ifSeqNo: 1,
            ifPrimaryTerm: 1,
          }],
          totalDestinations: 1,
        },
      });
    });

    test("should handle index not found error", async () => {
      const mockReq = {
        query: {
          from: 0,
          size: 20,
          search: "",
          sortDirection: "desc",
          sortField: "name",
          type: "ALL",
        },
      };
      const error = new Error();
      error.statusCode = 404;
      error.body = { 
        error: { 
          reason: 'Configured indices are not found: [.opendistro-alerting-config]'
        } 
      };
      mockClient.mockRejectedValueOnce(error);
    
      await destinationsService.getDestinations(mockContext, mockReq, mockRes);
    
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: {
          ok: true,
          resp: "Indices will be configured when the monitor is created: [.opendistro-alerting-config]"
        },
      });
    });
    
    test("should handle other errors", async () => {
      const mockReq = {
        query: {
          from: 0,
          size: 20,
          search: "",
          sortDirection: "desc",
          sortField: "name",
          type: "ALL",
        },
      };

      const error = new Error("Some error");
      mockClient.mockRejectedValueOnce(error);

      await destinationsService.getDestinations(mockContext, mockReq, mockRes);

      expect(mockRes.ok).toHaveBeenCalledWith({
        body: {
          ok: false,
          err: "Some error"
        },
      });
    });
    
  });
});
