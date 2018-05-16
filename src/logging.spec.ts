import "mocha";
import logger from "./logger";
import rootStore from "./store/root";
import {expect} from "chai";


describe('Spec on logger', () => {

  it('test error', () => {

    logger.log("error", 'oror', {label: 'test'});
  });

  it('test with format', () => {

    logger.info("asdsa %d", 10)
  });

  describe('Store logging', () => {
    before(() => {
      this.logging = rootStore.logStore;
    });

    it('get last logging', async () => {
      const docs = await this.logging.getLogs();

      expect(docs.length).to.eq(10)
    })
  })
});