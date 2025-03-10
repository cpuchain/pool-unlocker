import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "./common";
export interface ConsensusViewInterface extends Interface {
    getFunction(nameOrSignature: "getBlockRewards" | "getBlockRewardsRef" | "implementation" | "init" | "owner" | "send" | "updateImplementation" | "updateOwner"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "Sent" | "UpdatedImplementation" | "UpdatedOwner"): EventFragment;
    encodeFunctionData(functionFragment: "getBlockRewards", values: [BigNumberish, AddressLike]): string;
    encodeFunctionData(functionFragment: "getBlockRewardsRef", values: [BigNumberish, AddressLike]): string;
    encodeFunctionData(functionFragment: "implementation", values?: undefined): string;
    encodeFunctionData(functionFragment: "init", values?: undefined): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "send", values: [AddressLike[], BigNumberish[], BigNumberish]): string;
    encodeFunctionData(functionFragment: "updateImplementation", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "updateOwner", values: [AddressLike]): string;
    decodeFunctionResult(functionFragment: "getBlockRewards", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getBlockRewardsRef", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "implementation", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "init", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "send", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImplementation", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateOwner", data: BytesLike): Result;
}
export declare namespace SentEvent {
    type InputTuple = [
        to: AddressLike,
        value: BigNumberish,
        success: boolean
    ];
    type OutputTuple = [to: string, value: bigint, success: boolean];
    interface OutputObject {
        to: string;
        value: bigint;
        success: boolean;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace UpdatedImplementationEvent {
    type InputTuple = [newImplementation: AddressLike];
    type OutputTuple = [newImplementation: string];
    interface OutputObject {
        newImplementation: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace UpdatedOwnerEvent {
    type InputTuple = [newOwner: AddressLike];
    type OutputTuple = [newOwner: string];
    interface OutputObject {
        newOwner: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface ConsensusView extends BaseContract {
    connect(runner?: ContractRunner | null): ConsensusView;
    waitForDeployment(): Promise<this>;
    interface: ConsensusViewInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    getBlockRewards: TypedContractMethod<[
        nHeight: BigNumberish,
        coinbase: AddressLike
    ], [
        [
            boolean,
            string[],
            bigint[]
        ] & {
            staked: boolean;
            addresses: string[];
            rewards: bigint[];
        }
    ], "view">;
    getBlockRewardsRef: TypedContractMethod<[
        nHeight: BigNumberish,
        coinbase: AddressLike
    ], [
        [
            boolean,
            string[],
            bigint[]
        ] & {
            staked: boolean;
            addresses: string[];
            rewards: bigint[];
        }
    ], "view">;
    implementation: TypedContractMethod<[], [string], "view">;
    init: TypedContractMethod<[], [void], "nonpayable">;
    owner: TypedContractMethod<[], [string], "view">;
    send: TypedContractMethod<[
        addresses: AddressLike[],
        amounts: BigNumberish[],
        gasLimit: BigNumberish
    ], [
        void
    ], "payable">;
    updateImplementation: TypedContractMethod<[
        newImplementation: AddressLike
    ], [
        void
    ], "nonpayable">;
    updateOwner: TypedContractMethod<[
        newOwner: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "getBlockRewards"): TypedContractMethod<[
        nHeight: BigNumberish,
        coinbase: AddressLike
    ], [
        [
            boolean,
            string[],
            bigint[]
        ] & {
            staked: boolean;
            addresses: string[];
            rewards: bigint[];
        }
    ], "view">;
    getFunction(nameOrSignature: "getBlockRewardsRef"): TypedContractMethod<[
        nHeight: BigNumberish,
        coinbase: AddressLike
    ], [
        [
            boolean,
            string[],
            bigint[]
        ] & {
            staked: boolean;
            addresses: string[];
            rewards: bigint[];
        }
    ], "view">;
    getFunction(nameOrSignature: "implementation"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "init"): TypedContractMethod<[], [void], "nonpayable">;
    getFunction(nameOrSignature: "owner"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "send"): TypedContractMethod<[
        addresses: AddressLike[],
        amounts: BigNumberish[],
        gasLimit: BigNumberish
    ], [
        void
    ], "payable">;
    getFunction(nameOrSignature: "updateImplementation"): TypedContractMethod<[
        newImplementation: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "updateOwner"): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
    getEvent(key: "Sent"): TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
    getEvent(key: "UpdatedImplementation"): TypedContractEvent<UpdatedImplementationEvent.InputTuple, UpdatedImplementationEvent.OutputTuple, UpdatedImplementationEvent.OutputObject>;
    getEvent(key: "UpdatedOwner"): TypedContractEvent<UpdatedOwnerEvent.InputTuple, UpdatedOwnerEvent.OutputTuple, UpdatedOwnerEvent.OutputObject>;
    filters: {
        "Sent(address,uint256,bool)": TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
        Sent: TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
        "UpdatedImplementation(address)": TypedContractEvent<UpdatedImplementationEvent.InputTuple, UpdatedImplementationEvent.OutputTuple, UpdatedImplementationEvent.OutputObject>;
        UpdatedImplementation: TypedContractEvent<UpdatedImplementationEvent.InputTuple, UpdatedImplementationEvent.OutputTuple, UpdatedImplementationEvent.OutputObject>;
        "UpdatedOwner(address)": TypedContractEvent<UpdatedOwnerEvent.InputTuple, UpdatedOwnerEvent.OutputTuple, UpdatedOwnerEvent.OutputObject>;
        UpdatedOwner: TypedContractEvent<UpdatedOwnerEvent.InputTuple, UpdatedOwnerEvent.OutputTuple, UpdatedOwnerEvent.OutputObject>;
    };
}
